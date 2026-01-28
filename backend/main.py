"""
Felix Poly-Sin Lab — FastAPI Backend
Serves the API and the built React frontend as static files.
"""
import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.trait_manager import TraitManager
from services.felix_engine import FelixEngine

# ── App Setup ────────────────────────────────────────────────────────
app = FastAPI(title="Felix Poly-Sin Lab", version="2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

trait_manager = TraitManager()

# Engine is initialised lazily so the app can still start without a key
# (useful for health checks on Railway before env vars are set).
_engine: FelixEngine | None = None


def get_engine() -> FelixEngine:
    global _engine
    if _engine is None:
        _engine = FelixEngine(trait_manager)
    return _engine


# ── Request / Response Models ────────────────────────────────────────
class AnswerItem(BaseModel):
    question_id: str
    answer_text: str


class AnalyzeRequest(BaseModel):
    answers: list[AnswerItem]


# ── Questions file path ──────────────────────────────────────────────
QUESTIONS_FILE = Path(__file__).parent.parent / "felix_questions.json"


# ── API Endpoints ────────────────────────────────────────────────────
@app.get("/api/brain")
def get_brain():
    """Return the full trait library (for the Brain panel on the frontend)."""
    return trait_manager.get_library()


@app.get("/api/questions")
def get_questions():
    """Return the Felix questionnaire."""
    if not QUESTIONS_FILE.exists():
        raise HTTPException(status_code=404, detail="Questions file not found")
    with open(QUESTIONS_FILE) as f:
        return json.load(f)


@app.post("/api/analyze")
async def analyze(request: AnalyzeRequest):
    """Run Felix analysis on submitted answers."""
    try:
        engine = get_engine()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    answers = [a.model_dump() for a in request.answers]
    try:
        result = await engine.analyze(answers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
    return result


@app.get("/api/health")
def health():
    """Health check endpoint for Render / any hosting platform."""
    return {"status": "ok", "version": "2.1"}


# ── Serve React Frontend (production build) ──────────────────────────
# The built frontend lives at frontend/dist after `npm run build`.
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve index.html for any non-API route (SPA fallback)."""
        file_path = FRONTEND_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")
