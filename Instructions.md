

# Harmonia Phase 2: Standalone "Felix" Poly-Sin Lab

## 1. Project Overview
**Goal:** Build a standalone repository to develop and test the **"Felix" Psychometric Engine** using Google Gemini.
**Core Concept:** "Poly-Sin Mapping". Human behaviors are rarely 1-to-1 with the Seven Deadly Sins. They are complex vectors (e.g., *"Lust for Power"* is roughly 50% Pride, 40% Lust, 10% Wrath).
**Critical Constraint:** **No Hallucination.** The system must possess a persistent memory (`trait_library.json`). It must "learn" new complex traits once, save them to disk, and reuse them in future analysis.

---

## 2. Tech Stack & Directory Structure

**Stack:**
- **Backend:** Python 3.11+, FastAPI, `google-generativeai` (Gemini Pro), `pydantic`.
- **Data:** Local JSON file (The "Hippocampus").
- **Frontend:** React + Vite + TailwindCSS.

**File Structure:**
```text
harmonia-felix-lab/
├── backend/
│   ├── data/
│   │   ├── trait_library.json    # The "Memory" (Pre-seeded with examples)
│   │   └── profiles/             # Where generated results are saved
│   ├── services/
│   │   ├── trait_manager.py      # CRUD for the library
│   │   └── felix_engine.py       # Gemini interaction & Logic
│   ├── main.py                   # FastAPI endpoints
│   ├── .env                      # Contains GEMINI_API_KEY
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BrainVisualizer.tsx # Shows Memory vs. New Learning
│   │   │   └── SinSpectrum.tsx     # Visualizes the sin weights
│   │   └── App.tsx
│   └── ...
└── README.md
```

---

## 3. Data Architecture (The "Brain")

### 3.1 The Trait Library (`backend/data/trait_library.json`)
This file is the single source of truth. The AI is **forbidden** from inventing new names for behaviors that already exist in this file.

**Seed Data:**
```json
{
  "meta": {
    "version": "2.1",
    "description": "Poly-Sin Weighting Library"
  },
  "traits": {
    "status_signaling": {
      "definition": "The overt display of resources to establish hierarchy.",
      "sin_weights": { "pride": 0.8, "greed": 0.1, "envy": 0.1 },
      "complexity_score": 0.3
    },
    "lust_for_power": {
      "definition": "Seeking control over others to satisfy ego (Pride) and dominance desires (Lust).",
      "sin_weights": { "pride": 0.5, "lust": 0.4, "wrath": 0.1 },
      "complexity_score": 0.8
    }
  }
}
```

---

## 4. Backend Logic Implementation

### 4.1 Trait Manager (`services/trait_manager.py`)
**Responsibilities:**
1.  Load the JSON library on startup.
2.  Provide a text summary of existing traits (Knowledge Base) for the LLM prompt.
3.  **Assimilate** new traits: If the LLM returns a new trait definition, write it to the JSON file immediately.

### 4.2 Felix Engine (`services/felix_engine.py`)
**Responsibilities:**
1.  Fetch `knowledge_base` from TraitManager.
2.  Send the User's Answers + Knowledge Base to Gemini.
3.  Parse JSON response.
4.  Trigger `trait_manager.assimilate()` if new traits are found.

**The System Prompt (CRITICAL - Copy Exactly):**
```text
SYSTEM ROLE: You are 'Felix', an Advanced Evolutionary Psychologist.
OBJECTIVE: Map user behaviors to the 'Seven Deadly Sins' using Poly-Sin Vectors.

=== THE HIPPOCAMPUS (EXISTING MEMORY) ===
You MUST prioritize mapping answers to these existing definitions if they fit:
{knowledge_base_string}

=== THE INPUT ===
{user_answers_json}

=== THE PROTOCOL ===
1. Analyze the user's answer.
2. Search your MEMORY. Does a trait (like 'lust_for_power') already explain this? If yes, use it.
3. IF AND ONLY IF the behavior is nuanced and distinct from memory, DEFINE A NEW TRAIT.
4. A New Trait must define "sin_weights" (e.g., {{ "pride": 0.6, "sloth": 0.4 }}).

=== OUTPUT SCHEMA (Strict JSON) ===
{{
    "analysis_log": [
        {{
            "question_id": "q1",
            "answer_text": "...",
            "assigned_trait": "trait_key_snake_case",
            "is_new_discovery": boolean,
            "match_reasoning": "Why this fits..."
        }}
    ],
    "new_trait_definitions": {{
        "only_if_is_new_discovery_is_true": {{
            "definition": "Precise definition",
            "sin_weights": {{ "lust": 0.0, "gluttony": 0.0, "greed": 0.0, "sloth": 0.0, "wrath": 0.0, "envy": 0.0, "pride": 0.0 }},
            "complexity_score": 0.0-1.0
        }}
    }}
}}
```

### 4.3 API Endpoints (`main.py`)
- `GET /api/brain`: Returns the full content of `trait_library.json` (for the Frontend visualization).
- `POST /api/analyze`: Accepts answers, runs Felix Engine, updates Library, returns Analysis.

---

## 5. Frontend Requirements (React)

The UI must visually demonstrate the "Self-Learning" and "Poly-Sin" aspects.

### 5.1 The Interface
Split the screen into two columns:
1.  **Left (The Input):** The "Fixed Five" questions with text inputs and a "Analyze" button.
2.  **Right (The Brain):**
    - **Live Library:** A list of all known traits.
    - **Visual Cues:** When a new trait is learned, highlight it in **Green** ("Assimilated"). Existing traits used in the response show in **Blue** ("Recalled").

### 5.2 Visualization (`SinSpectrum` Component)
Do not just list the sins. Render a **Stacked Bar Chart** for the traits.
- *Example:* "Lust for Power" bar should be 50% Purple (Pride), 40% Red (Lust), 10% Orange (Wrath).

---

## 6. Execution Instructions for AI Builder

1.  **Initialize Project:** Create the directory structure defined in Section 2.
2.  **Create Seed Data:** Create `trait_library.json` with the exact content from Section 3.
3.  **Implement Backend:**
    - Build `TraitManager` to handle JSON reading/writing.
    - Build `FelixEngine` using `google.generativeai`. **Enforce** the prompt in Section 4.2.
    - Create the API endpoints.
4.  **Implement Frontend:**
    - Build the React app.
    - Ensure the "Brain" panel fetches data from `/api/brain` to show the library growing in real-time.
5.  **Environment:** Ensure `.env` is set up to accept `GEMINI_API_KEY`.

**Success Criteria:**
1.  User enters a complex answer (e.g., "I steal to feed my family").
2.  Gemini identifies this isn't just Greed. It creates a new trait (e.g., `altruistic_theft` with weights `{greed: 0.3, pride: 0.2, envy: 0.5}`).
3.  The backend saves `altruistic_theft` to `trait_library.json`.
4.  The frontend shows this new trait appear in the list.
5.  If the user submits the same answer again, the system uses the *existing* trait instead of creating a new one.
