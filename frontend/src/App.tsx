/**
 * App.tsx — Main Felix Poly-Sin Lab interface.
 *
 * Layout: two-column split.
 *   Left:  Question form + analysis results.
 *   Right: Brain visualiser (trait library).
 */
import { useEffect, useState } from "react";
import BrainVisualizer from "./components/BrainVisualizer";
import AnalysisResults from "./components/AnalysisResults";

// ── Types ────────────────────────────────────────────────────────────
interface Question {
  id: string;
  title: string;
  question: string;
}

interface QuestionData {
  questions: Record<string, Question[]>;
  metadata: { total_questions: number };
}

interface Trait {
  definition: string;
  sin_weights: Record<string, number>;
  complexity_score: number;
}

interface BrainData {
  traits: Record<string, Trait>;
}

interface AnalysisLogEntry {
  question_id: string;
  answer_text: string;
  assigned_trait: string;
  is_new_discovery: boolean;
  match_reasoning: string;
}

// ── Component ────────────────────────────────────────────────────────
function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [brain, setBrain] = useState<Record<string, Trait>>({});
  const [analysisLog, setAnalysisLog] = useState<AnalysisLogEntry[]>([]);
  const [newlyAdded, setNewlyAdded] = useState<string[]>([]);
  const [usedTraits, setUsedTraits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBlock, setActiveBlock] = useState(0);
  const [blockNames, setBlockNames] = useState<string[]>([]);
  const [questionsByBlock, setQuestionsByBlock] = useState<Question[][]>([]);

  // Fetch questions and brain on mount
  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data: QuestionData) => {
        const blocks = Object.entries(data.questions);
        setBlockNames(blocks.map(([name]) => name));
        setQuestionsByBlock(blocks.map(([, qs]) => qs));
        // Flatten for backwards compat
        const all = blocks.flatMap(([, qs]) => qs);
        setQuestions(all);
      })
      .catch(() => setError("Failed to load questions"));

    fetchBrain();
  }, []);

  function fetchBrain() {
    fetch("/api/brain")
      .then((r) => r.json())
      .then((data: BrainData) => setBrain(data.traits || {}))
      .catch(() => {});
  }

  async function handleAnalyze() {
    // Build answer list from current answers
    const answerList = questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({ question_id: q.id, answer_text: answers[q.id].trim() }));

    if (answerList.length === 0) {
      setError("Please answer at least one question.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisLog([]);
    setNewlyAdded([]);
    setUsedTraits([]);

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answerList }),
      });

      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail.detail || `Server error ${resp.status}`);
      }

      const result = await resp.json();
      setAnalysisLog(result.analysis_log || []);
      setNewlyAdded(result._newly_added_traits || []);
      setUsedTraits(
        (result.analysis_log || []).map(
          (e: AnalysisLogEntry) => e.assigned_trait
        )
      );

      // Refresh brain to show new traits
      fetchBrain();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  // Current block questions
  const currentQuestions = questionsByBlock[activeBlock] || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-purple-800/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-purple-300 tracking-tight">
          Felix Poly-Sin Lab
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Psychometric Engine v2.1 — Mapping human behavior to poly-sin vectors
        </p>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT — Input Panel */}
        <div className="lg:w-3/5 p-6 overflow-y-auto">
          {/* Block Tabs */}
          {blockNames.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {blockNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBlock(i)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    i === activeBlock
                      ? "bg-purple-700 border-purple-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {name.replace(/^Block \d+:\s*/, "")}
                </button>
              ))}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-4">
            {currentQuestions.map((q) => (
              <div key={q.id} className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
                <label className="block mb-2">
                  <span className="text-sm font-semibold text-gray-200">
                    {q.title}
                  </span>
                  <span className="block text-xs text-gray-400 mt-1">
                    {q.question}
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Type your answer (25-150 words)..."
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            ))}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-6 w-full bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-wait text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm"
          >
            {loading ? "Felix is thinking..." : "Analyze with Felix"}
          </button>

          {error && (
            <div className="mt-3 text-red-400 bg-red-900/30 border border-red-800 rounded-lg p-3 text-xs">
              {error}
            </div>
          )}

          {/* Analysis Results */}
          <AnalysisResults log={analysisLog} />
        </div>

        {/* RIGHT — Brain Panel */}
        <div className="lg:w-2/5 bg-gray-950/50 border-l border-gray-800 p-6 overflow-y-auto">
          <BrainVisualizer
            traits={brain}
            newlyAdded={newlyAdded}
            usedTraits={usedTraits}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
