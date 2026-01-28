"""
Trait Manager - The "Hippocampus" of Felix
Handles reading/writing the trait_library.json file.
"""
import json
import os
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent.parent / "data"
TRAIT_FILE = DATA_DIR / "trait_library.json"


class TraitManager:
    def __init__(self):
        self._library: dict[str, Any] = {}
        self.load()

    def load(self) -> dict[str, Any]:
        """Load the trait library from disk."""
        if TRAIT_FILE.exists():
            with open(TRAIT_FILE, "r") as f:
                self._library = json.load(f)
        else:
            self._library = {
                "meta": {"version": "2.1", "description": "Poly-Sin Weighting Library"},
                "traits": {},
            }
            self._save()
        return self._library

    def _save(self):
        """Persist the library to disk."""
        TRAIT_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(TRAIT_FILE, "w") as f:
            json.dump(self._library, f, indent=2)

    def get_library(self) -> dict[str, Any]:
        """Return the full library dict."""
        return self._library

    def get_traits(self) -> dict[str, Any]:
        """Return just the traits section."""
        return self._library.get("traits", {})

    def get_knowledge_base_string(self) -> str:
        """
        Build a text summary of every known trait for injection into the LLM prompt.
        This is what Felix uses as its 'memory'.
        """
        traits = self.get_traits()
        if not traits:
            return "(No traits learned yet)"

        lines = []
        for key, data in traits.items():
            weights = data.get("sin_weights", {})
            weight_str = ", ".join(f"{s}: {w}" for s, w in weights.items() if w > 0)
            lines.append(
                f"- {key}: {data.get('definition', 'No definition')} "
                f"[Weights: {weight_str}] "
                f"(complexity: {data.get('complexity_score', 0)})"
            )
        return "\n".join(lines)

    def assimilate(self, new_traits: dict[str, Any]) -> list[str]:
        """
        Merge new trait definitions discovered by Felix into the library.
        Returns a list of newly added trait keys.
        """
        added = []
        for trait_key, trait_data in new_traits.items():
            if trait_key in self._library["traits"]:
                continue  # already known
            # Validate minimum structure
            if "definition" in trait_data and "sin_weights" in trait_data:
                self._library["traits"][trait_key] = trait_data
                added.append(trait_key)

        if added:
            self._save()
        return added
