/**
 * AnalysisResults — Displays the per-question breakdown Felix returns.
 */
import React from "react";

interface LogEntry {
  question_id: string;
  answer_text: string;
  assigned_trait: string;
  is_new_discovery: boolean;
  match_reasoning: string;
}

interface Props {
  log: LogEntry[];
}

const AnalysisResults: React.FC<Props> = ({ log }) => {
  if (log.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-3 text-amber-300">Analysis Results</h2>
      <div className="space-y-3">
        {log.map((entry, i) => (
          <div
            key={i}
            className={`border rounded-lg p-3 bg-gray-900/50 ${
              entry.is_new_discovery ? "border-green-500" : "border-blue-500"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gray-400">
                {entry.question_id}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full text-white ${
                  entry.is_new_discovery ? "bg-green-600" : "bg-blue-600"
                }`}
              >
                {entry.is_new_discovery ? "NEW DISCOVERY" : "RECALLED"}
              </span>
              <span className="font-mono text-sm text-purple-200 ml-auto">
                {entry.assigned_trait}
              </span>
            </div>
            <p className="text-xs text-gray-400 italic mb-1">
              "{entry.answer_text}"
            </p>
            <p className="text-xs text-gray-300">{entry.match_reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisResults;
