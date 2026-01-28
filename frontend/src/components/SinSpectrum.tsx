/**
 * SinSpectrum — Stacked bar chart visualizing poly-sin weights for a trait.
 *
 * KEY CUSTOMISATION POINT:
 *   - SIN_COLORS: change hex codes to restyle the bar colours.
 *   - The component auto-normalises weights so they always fill 100%.
 */
import React from "react";

const SIN_COLORS: Record<string, string> = {
  pride:    "#8b5cf6", // purple
  lust:     "#ef4444", // red
  greed:    "#f59e0b", // amber
  wrath:    "#f97316", // orange
  envy:     "#22c55e", // green
  gluttony: "#ec4899", // pink
  sloth:    "#6b7280", // gray
};

interface Props {
  weights: Record<string, number>;
  label?: string;
}

const SinSpectrum: React.FC<Props> = ({ weights, label }) => {
  const total = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
  const sorted = Object.entries(weights)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="mb-3">
      {label && (
        <p className="text-xs text-gray-400 mb-1 font-mono">{label}</p>
      )}
      <div className="flex h-6 rounded overflow-hidden">
        {sorted.map(([sin, value]) => (
          <div
            key={sin}
            title={`${sin}: ${Math.round((value / total) * 100)}%`}
            className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
            style={{
              width: `${(value / total) * 100}%`,
              backgroundColor: SIN_COLORS[sin] || "#64748b",
              minWidth: value > 0 ? "18px" : "0",
            }}
          >
            {(value / total) >= 0.15 ? sin.slice(0, 3).toUpperCase() : ""}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-1">
        {sorted.map(([sin, value]) => (
          <span key={sin} className="text-[10px] text-gray-500">
            <span
              className="inline-block w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: SIN_COLORS[sin] || "#64748b" }}
            />
            {sin} {Math.round((value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
};

export default SinSpectrum;
