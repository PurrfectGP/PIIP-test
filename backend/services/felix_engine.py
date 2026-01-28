"""
Felix Engine - The Gemini-powered psychometric analysis core.
Uses the Poly-Sin mapping protocol to analyze user answers.
Compatible with Gemini 2.5 Pro and Gemini 2.0 Flash models.
"""
import json
import os
import re
from typing import Any

from google import genai
from google.genai import types

from .trait_manager import TraitManager

# ── Model Configuration ─────────────────────────────────────────────
# Change this to swap models. Recommended options:
#   "gemini-2.5-pro-preview-05-06"  (best quality, slower)
#   "gemini-2.0-flash"              (fast, cheaper)
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro-preview-05-06")

SYSTEM_PROMPT = """SYSTEM ROLE: You are 'Felix', an Advanced Evolutionary Psychologist.
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
            "complexity_score": 0.0
        }}
    }}
}}

IMPORTANT: Return ONLY valid JSON. No markdown fences. No extra text."""


class FelixEngine:
    def __init__(self, trait_manager: TraitManager):
        self.trait_manager = trait_manager
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        self.client = genai.Client(api_key=api_key)
        self.model = DEFAULT_MODEL

    async def analyze(self, answers: list[dict[str, str]]) -> dict[str, Any]:
        """
        Run Felix analysis on user answers.
        answers: list of {"question_id": "...", "answer_text": "..."}
        """
        knowledge_base = self.trait_manager.get_knowledge_base_string()
        answers_json = json.dumps(answers, indent=2)

        prompt = SYSTEM_PROMPT.format(
            knowledge_base_string=knowledge_base,
            user_answers_json=answers_json,
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=4096,
            ),
        )

        raw_text = response.text.strip()

        # Strip markdown code fences if the model wraps its output
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
            raw_text = re.sub(r"\s*```$", "", raw_text)

        result = json.loads(raw_text)

        # Assimilate any new traits into the library
        new_defs = result.get("new_trait_definitions", {})
        newly_added = self.trait_manager.assimilate(new_defs)

        result["_newly_added_traits"] = newly_added
        return result
