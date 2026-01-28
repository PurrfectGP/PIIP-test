/**
 * BrainVisualizer — Shows Felix's memory: the trait library.
 *
 * Traits are colour-coded:
 *   GREEN  = newly learned this session
 *   BLUE   = recalled from existing memory
 */
import React from "react";
import SinSpectrum from "./SinSpectrum";

interface Trait {
  definition: string;
  sin_weights: Record<string, number>;
  complexity_score: number;
}

interface Props {
  traits: Record<string, Trait>;
  newlyAdded: string[];    // traits added in the latest analysis
  usedTraits: string[];    // traits referenced in the latest analysis
}

const BrainVisualizer: React.FC<Props> = ({ traits, newlyAdded, usedTraits }) => {
  const traitKeys = Object.keys(traits);

  return (
    <div>
      <h2 className="text-lg font-bold mb-3 text-purple-300">
        Felix's Brain ({traitKeys.length} traits)
      </h2>

      {traitKeys.length === 0 && (
        <p className="text-gray-500 text-sm">No traits learned yet.</p>
      )}

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {traitKeys.map((key) => {
          const trait = traits[key];
          const isNew = newlyAdded.includes(key);
          const isUsed = usedTraits.includes(key);

          let borderColor = "border-gray-700";
          let badge = null;
          if (isNew) {
            borderColor = "border-green-500";
            badge = (
              <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full ml-2">
                ASSIMILATED
              </span>
            );
          } else if (isUsed) {
            borderColor = "border-blue-500";
            badge = (
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full ml-2">
                RECALLED
              </span>
            );
          }

          return (
            <div
              key={key}
              className={`border ${borderColor} rounded-lg p-3 bg-gray-900/50 transition-all duration-300`}
            >
              <div className="flex items-center mb-1">
                <span className="font-mono text-sm text-purple-200">
                  {key}
                </span>
                {badge}
                <span className="ml-auto text-[10px] text-gray-500">
                  complexity: {trait.complexity_score}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{trait.definition}</p>
              <SinSpectrum weights={trait.sin_weights} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrainVisualizer;
