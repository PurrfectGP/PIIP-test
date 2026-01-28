# Felix Poly-Sin Lab

## What Is This?

Felix is a **psychometric personality engine**. It asks people 28 behavioral questions (like "What do you do when someone cuts in line?"), sends their answers to Google's Gemini AI, and gets back a psychological profile that maps their behavior to the **Seven Deadly Sins** — but not as simple labels. Instead, each behavior is mapped as a **blend** of multiple sins (called "Poly-Sin Vectors").

**Example:** If someone says *"I steal to feed my family"*, Felix might classify that as:
- 30% Greed (the act of taking)
- 20% Pride (self-reliance)
- 50% Envy (feeling deprived compared to others)

Felix names this pattern `altruistic_theft` and **remembers it forever**. Next time someone gives a similar answer, Felix reuses the existing pattern instead of inventing a new one. This is the "self-learning" brain.

---

## How It Works (The Big Picture)

```
User answers questions
        |
        v
Frontend (React) sends answers to Backend (Python)
        |
        v
Backend sends answers + its existing "memory" to Google Gemini AI
        |
        v
Gemini returns analysis: which traits match, any new traits discovered
        |
        v
Backend saves new traits to trait_library.json (the "brain")
        |
        v
Frontend shows results with color-coded bars and highlights new learning
```

### The Three Parts

1. **Frontend** (what the user sees) — A React web app with a question form on the left and Felix's "brain" (trait library) on the right. Built with Vite + TailwindCSS.

2. **Backend** (the server) — A Python FastAPI server that handles API requests, talks to Google Gemini, and manages the trait library JSON file.

3. **Trait Library** (`backend/data/trait_library.json`) — A JSON file that acts as Felix's persistent memory. It starts with 6 pre-seeded traits and grows as Felix discovers new patterns.

---

## File Structure (What Each File Does)

```
PIIP-test/
├── backend/
│   ├── main.py                    # The server — defines API endpoints
│   ├── requirements.txt           # Python packages needed
│   ├── .env.example               # Template for your API key
│   ├── data/
│   │   ├── trait_library.json     # Felix's "brain" / memory
│   │   └── profiles/              # (future) saved user profiles
│   └── services/
│       ├── trait_manager.py       # Reads/writes the trait library
│       └── felix_engine.py        # Talks to Gemini AI
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main page layout & logic
│   │   ├── main.tsx               # App entry point
│   │   ├── index.css              # Global styles
│   │   └── components/
│   │       ├── SinSpectrum.tsx     # Color-coded sin weight bars
│   │       ├── BrainVisualizer.tsx # Shows all known traits
│   │       └── AnalysisResults.tsx # Shows per-question breakdown
│   ├── dist/                      # Pre-built production files
│   ├── package.json               # Node.js dependencies
│   └── vite.config.ts             # Build configuration
├── felix_questions.json           # All 28 questions (6 blocks)
├── Instructions.md                # Original spec document
├── Procfile                       # Railway start command
├── railway.toml                   # Railway deployment config
├── nixpacks.toml                  # Railway build steps
└── README.md                      # This file
```

---

## Key Parts You Can Edit (For Avery)

### 1. Change the Questions

**File:** `felix_questions.json`

This file contains all 28 questions organized into 6 blocks. To edit:

- Open the file in any text editor
- Each question looks like this:
  ```json
  {
    "id": "social_1",
    "title": "The Group Dinner Check",
    "question": "The bill arrives at a group dinner. Everyone contributed differently to the total. What's your approach?"
  }
  ```
- **`id`**: A unique identifier (keep it lowercase with underscores, like `social_1`)
- **`title`**: The display name shown to the user
- **`question`**: The actual question text

To add a new question, copy an existing one and change the values. To remove one, delete the entire `{...}` block (and the comma before/after it).

Update `total_questions` in the `metadata` section at the bottom if you add/remove questions.

### 2. Change the AI Model

**File:** `backend/services/felix_engine.py`

Near the top of the file, find this line:

```python
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro-preview-05-06")
```

You can change the model in two ways:
- **In the code:** Replace `"gemini-2.5-pro-preview-05-06"` with another model name
- **Via environment variable:** Set `GEMINI_MODEL=gemini-2.0-flash` (no code change needed)

**Available models you might use:**
| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| `gemini-2.5-pro-preview-05-06` | Slower | Best | Higher |
| `gemini-2.0-flash` | Fast | Good | Lower |

When Gemini 3 Pro releases, just swap in the new model name (e.g., `gemini-3.0-pro` or whatever Google names it). The code is model-agnostic — it just sends text and receives JSON back.

### 3. Change Felix's Personality / Prompt

**File:** `backend/services/felix_engine.py`

The big text block called `SYSTEM_PROMPT` is the instructions Felix follows. You can change:
- The role description ("Advanced Evolutionary Psychologist")
- How Felix should analyze answers
- The output format (be careful here — the frontend expects specific JSON fields)

### 4. Change the Starting Traits (Felix's Initial Memory)

**File:** `backend/data/trait_library.json`

This is what Felix "knows" before any user ever interacts with it. Each trait looks like:

```json
"status_signaling": {
  "definition": "The overt display of resources to establish hierarchy.",
  "sin_weights": { "pride": 0.8, "greed": 0.1, "envy": 0.1 },
  "complexity_score": 0.3
}
```

- **Key** (`status_signaling`): The trait name (lowercase, underscores)
- **`definition`**: What the behavior means
- **`sin_weights`**: How much of each sin (0.0 to 1.0). Should roughly add up to 1.0
- **`complexity_score`**: 0.0 (simple) to 1.0 (very complex behavior)

The seven sins are: `pride`, `lust`, `greed`, `sloth`, `wrath`, `envy`, `gluttony`.

### 5. Change the Colors

**File:** `frontend/src/components/SinSpectrum.tsx`

Near the top, find `SIN_COLORS`:

```typescript
const SIN_COLORS: Record<string, string> = {
  pride:    "#8b5cf6", // purple
  lust:     "#ef4444", // red
  greed:    "#f59e0b", // amber
  wrath:    "#f97316", // orange
  envy:     "#22c55e", // green
  gluttony: "#ec4899", // pink
  sloth:    "#6b7280", // gray
};
```

Change the hex color codes to whatever you want. Use a color picker (search "hex color picker" on Google) to find colors.

**After changing frontend files**, you need to rebuild:
```bash
cd frontend && npm run build
```

### 6. Change the UI Layout / Text

**File:** `frontend/src/App.tsx`

- The header text ("Felix Poly-Sin Lab") is near the top of the `return` section
- Question blocks are rendered as tabs — the tab labels come from `felix_questions.json` block names
- The "Analyze with Felix" button text is in the button element

---

## Getting Your Own Google Gemini API Key

This is the key that lets Felix talk to Google's AI. Here's how to get one (free tier available):

### Step-by-Step

1. **Go to Google AI Studio:** Open your browser and go to:
   ```
   https://aistudio.google.com/apikey
   ```

2. **Sign in** with your Google account (any Gmail works).

3. **Click "Create API Key"** — it's a blue button near the top.

4. **Select a Google Cloud project** (or let it create one for you).

5. **Copy the key** — it looks like a long string starting with `AIza...`

6. **Keep it secret.** Do not share it publicly or commit it to GitHub.

### Free Tier Limits (as of 2025)

- Gemini 2.5 Pro: 25 requests per day (free), or pay-as-you-go
- Gemini 2.0 Flash: 1500 requests per day (free)

For testing, the free tier is enough. For production with many users, you will need to enable billing in Google Cloud Console.

---

## Running Locally (Development)

### Prerequisites

- **Python 3.11+** installed
- **Node.js 18+** installed
- A **Gemini API key** (see above)

### Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd PIIP-test

# 2. Set up the backend
cd backend
pip install -r requirements.txt

# 3. Create your .env file
cp .env.example .env
# Now open .env in a text editor and paste your API key:
#   GEMINI_API_KEY=AIzaSy...your_key_here

# 4. Start the backend
python -m uvicorn main:app --reload --port 8000
# Leave this terminal running

# 5. In a NEW terminal, set up the frontend
cd frontend
npm install
npm run dev
# This opens the app at http://localhost:5173
```

The frontend dev server proxies `/api` requests to the backend at `localhost:8000`, so both need to be running.

### Production Mode (Local)

```bash
# Build the frontend
cd frontend && npm run build

# Run just the backend (it serves the built frontend too)
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
# Open http://localhost:8000
```

---

## Deploying to Railway

Railway is a cloud platform that hosts your app on the internet. Here's how to deploy Felix.

### Step 1: Create a Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended — makes deployment easier)

### Step 2: Connect Your Repository

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub Repo"**
3. Find and select your `PIIP-test` repository
4. Railway will detect the project and start building

### Step 3: Add Your API Key

This is the most important step. Railway needs your Gemini key as a secret environment variable.

1. In your Railway project, click on the **service** (the box that appeared)
2. Go to the **"Variables"** tab
3. Click **"+ New Variable"**
4. Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your API key (paste the `AIza...` string)
5. (Optional) Add another variable:
   - **Name:** `GEMINI_MODEL`
   - **Value:** `gemini-2.5-pro-preview-05-06` (or `gemini-2.0-flash` for cheaper/faster)

### Step 4: Set the Port (Usually Automatic)

Railway sets `PORT` automatically. The app reads it via `${PORT:-8000}`. You should not need to change anything, but if the deploy fails, add:
- **Name:** `PORT`
- **Value:** `8000`

### Step 5: Deploy

Railway auto-deploys when you push to GitHub. To trigger manually:
1. Go to the **"Deployments"** tab
2. Click **"Deploy"** or push a new commit

### Step 6: Get Your URL

Once deployed (green checkmark):
1. Go to **"Settings"** tab
2. Under **"Networking"** → **"Public Networking"**
3. Click **"Generate Domain"**
4. You'll get a URL like `felix-lab-production.up.railway.app`

That's your live app. Share the URL with anyone.

### Updating After Deployment

Just push to GitHub. Railway auto-redeploys.

```bash
git add .
git commit -m "Updated questions"
git push
```

### Railway Costs

- **Free trial:** $5 credit (enough for testing)
- **Hobby plan:** $5/month for always-on apps
- The app uses minimal resources (one small Python server)

---

## How the Gemini Model Setting Works

The app is built to be **model-agnostic**. It uses the Google GenAI SDK which supports any Gemini model. The model is set by:

1. The `GEMINI_MODEL` environment variable (highest priority)
2. The default in code: `gemini-2.5-pro-preview-05-06`

### When Gemini 3 Pro Comes Out

When Google releases Gemini 3 Pro, just change the environment variable on Railway:

1. Go to your Railway project → Variables
2. Change `GEMINI_MODEL` to the new model ID (e.g., `gemini-3.0-pro` — check Google's docs for the exact name)
3. Railway will auto-redeploy

No code changes needed. The system sends text prompts and parses JSON responses — this works the same across all Gemini models.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "GEMINI_API_KEY environment variable is not set" | Create `.env` file in `backend/` with your key, or set it in Railway Variables |
| "Analysis failed" after clicking Analyze | Check that your API key is valid and has quota remaining |
| Frontend shows "Failed to load questions" | Make sure the backend is running (check terminal for errors) |
| Railway build fails | Check that `requirements.txt` and `package.json` are committed to git |
| Railway deploy fails with port error | Add `PORT=8000` environment variable in Railway |
| Gemini returns errors about model not found | The model name may have changed — check Google AI Studio for current model IDs |

---

## API Reference (For Developers)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (returns `{"status": "ok"}`) |
| `/api/brain` | GET | Returns the full trait library |
| `/api/questions` | GET | Returns all 28 questions |
| `/api/analyze` | POST | Sends answers to Felix for analysis |

### POST /api/analyze — Request Body

```json
{
  "answers": [
    { "question_id": "social_1", "answer_text": "I would split it evenly..." },
    { "question_id": "stress_2", "answer_text": "I would feel stressed..." }
  ]
}
```

### POST /api/analyze — Response

```json
{
  "analysis_log": [
    {
      "question_id": "social_1",
      "answer_text": "I would split it evenly...",
      "assigned_trait": "people_pleasing",
      "is_new_discovery": false,
      "match_reasoning": "The behavior shows a desire to avoid conflict..."
    }
  ],
  "new_trait_definitions": {},
  "_newly_added_traits": []
}
```
