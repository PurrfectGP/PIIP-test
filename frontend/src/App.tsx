/**
 * App.tsx — Main Felix Poly-Sin Lab interface.
 *
 * Layout: two-column split.
 *   Left:  Question form + analysis results.
 *   Right: Brain visualiser (trait library).
 *
 * Features:
 *   - Choose how many questions per block (dropdown per block)
 *   - Questions are randomised within each block on every generate
 */
import { useEffect, useState, useCallback } from "react";
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

// ── Helpers ──────────────────────────────────────────────────────────
/** Fisher-Yates shuffle — returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Component ────────────────────────────────────────────────────────
function App() {
  // Raw data from API (never mutated)
  const [allBlockNames, setAllBlockNames] = useState<string[]>([]);
  const [allBlockQuestions, setAllBlockQuestions] = useState<Question[][]>([]);

  // Per-block count selections (index → count)
  const [counts, setCounts] = useState<number[]>([]);

  // The currently-displayed randomised subset
  const [activeQuestions, setActiveQuestions] = useState<Question[][]>([]);
  const [generated, setGenerated] = useState(false);

  // Shared state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [brain, setBrain] = useState<Record<string, Trait>>({});
  const [analysisLog, setAnalysisLog] = useState<AnalysisLogEntry[]>([]);
  const [newlyAdded, setNewlyAdded] = useState<string[]>([]);
  const [usedTraits, setUsedTraits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBlock, setActiveBlock] = useState(0);

  // Fetch questions and brain on mount
  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data: QuestionData) => {
        const blocks = Object.entries(data.questions);
        const names = blocks.map(([name]) => name);
        const qs = blocks.map(([, q]) => q);
        setAllBlockNames(names);
        setAllBlockQuestions(qs);
        // Default: 1 question per block
        setCounts(qs.map(() => 1));
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

  // Generate randomised question set based on current counts
  const handleGenerate = useCallback(() => {
    const selected = allBlockQuestions.map((blockQs, i) => {
      const n = Math.min(counts[i], blockQs.length);
      return shuffle(blockQs).slice(0, n);
    });
    setActiveQuestions(selected);
    setAnswers({});
    setAnalysisLog([]);
    setNewlyAdded([]);
    setUsedTraits([]);
    setError(null);
    setActiveBlock(0);
    setGenerated(true);
  }, [allBlockQuestions, counts]);

  async function handleAnalyze() {
    // Flatten all active questions
    const allActive = activeQuestions.flat();
    const answerList = allActive
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

      fetchBrain();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const totalSelected = counts.reduce((s, c) => s + c, 0);
  const currentQuestions = activeQuestions[activeBlock] || [];

  // ── Setup Screen (choose counts) ──────────────────────────────────
  if (!generated) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-gray-900 border-b border-purple-800/50 px-6 py-4">
          <h1 className="text-2xl font-bold text-purple-300 tracking-tight">
            Felix Poly-Sin Lab
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Psychometric Engine v2.1 — Mapping human behavior to poly-sin vectors
          </p>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-gray-900/60 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-purple-200 mb-1">
              Configure Your Session
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Choose how many questions from each block. Questions will be randomised.
            </p>

            {/* Same-for-all shortcut */}
            <div className="flex items-center justify-between bg-purple-900/30 border border-purple-700/50 rounded-lg px-4 py-3 mb-4">
              <span className="text-sm font-semibold text-purple-200">
                Same for all blocks
              </span>
              <select
                value=""
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setCounts((prev) =>
                    prev.map((_, i) =>
                      Math.min(n, allBlockQuestions[i]?.length || 0)
                    )
                  );
                }}
                className="bg-gray-700 border border-purple-600 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-purple-400"
              >
                <option value="" disabled>
                  Pick...
                </option>
                {Array.from({ length: 9 }, (_, n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {allBlockNames.map((name, i) => {
                const maxQ = allBlockQuestions[i]?.length || 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3"
                  >
                    <div>
                      <span className="text-sm text-gray-200">
                        {name.replace(/^Block \d+:\s*/, "")}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-2">
                        ({maxQ} available)
                      </span>
                    </div>
                    <select
                      value={counts[i] ?? 1}
                      onChange={(e) =>
                        setCounts((prev) => {
                          const next = [...prev];
                          next[i] = Number(e.target.value);
                          return next;
                        })
                      }
                      className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                    >
                      {Array.from({ length: maxQ + 1 }, (_, n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Total questions: {totalSelected}
            </div>

            <button
              onClick={handleGenerate}
              disabled={totalSelected === 0}
              className="mt-4 w-full bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm"
            >
              {totalSelected === 0
                ? "Select at least 1 question"
                : `Generate ${totalSelected} Randomised Questions`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Screen (answer questions) ────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-purple-800/50 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-300 tracking-tight">
            Felix Poly-Sin Lab
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Psychometric Engine v2.1 — {totalSelected} randomised questions
          </p>
        </div>
        <button
          onClick={() => {
            setGenerated(false);
            setAnalysisLog([]);
            setNewlyAdded([]);
            setUsedTraits([]);
          }}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Reconfigure
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT — Input Panel */}
        <div className="lg:w-3/5 p-6 overflow-y-auto">
          {/* Block Tabs — only show blocks that have questions selected */}
          {allBlockNames.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {allBlockNames.map((name, i) => {
                const blockCount = activeQuestions[i]?.length || 0;
                if (blockCount === 0) return null;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveBlock(i)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      i === activeBlock
                        ? "bg-purple-700 border-purple-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {name.replace(/^Block \d+:\s*/, "")} ({blockCount})
                  </button>
                );
              })}
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
