ANALYSIS_SYSTEM = (
    "You are an educational content analyzer. Analyze the supplied educational document "
    "and return ONLY valid JSON matching the requested schema. Extract information from "
    "the document; do not invent information. Preserve the meaning of the source material."
)

SCHEMA_EXAMPLE = """{
  "title": "<document title, or null>",
  "subject": "<academic subject, or null>",
  "summary": "<2-3 sentence summary of the document, or null>",
  "concepts": [
    {
      "title": "<concept name>",
      "explanation": "<concise explanation based on the document>",
      "examples": ["<example given in the document, e.g. a code snippet or worked case>"],
      "learning_objectives": ["<1-2 realistic objectives starting with a verb>"],
      "dimensions": ["<only the allowed dimensions that genuinely apply>"]
    }
  ],
  "exercises": [
    {
      "title": "<exercise title or number>",
      "instructions": ["<one question or instruction per item>"],
      "difficulty": "easy" | "medium" | "hard" | null
    }
  ],
  "solutions": [
    {"exercise": "<title of the exercise it solves>", "answer": "<solution as given in the document>"}
  ],
  "projects": [
    {"title": "<project title>", "description": "<what to build>", "requirements": ["<requirement>"]}
  ],
  "homework": [
    {"title": "<homework title>", "tasks": ["<task>"]}
  ],
  "important_terms": [
    {"term": "<term>", "definition": "<short definition from the document>"}
  ]
}"""


def build_analysis_prompt(material: str, subject: str, level: str) -> str:
    return f"""Analyze ONLY the educational document between the <material> tags.

Rules:
- Extract what is in the document. Do not invent concepts, exercises, solutions, projects, homework or terms that are not supported by it.
- If a section is absent, return an empty array ([]) for lists, or null for title, subject, summary and difficulty. Never fill a section just to have content.
- concepts: the important ideas taught, not every sentence (at most 15). Keep explanations concise. Include examples only if the document gives them.
- exercises: practice questions or tasks for students. Set difficulty only if it is reasonably inferable, otherwise null.
- solutions: only answers actually present in the document.
- projects: mini-projects or larger tasks. homework: assignments given for after the session.
- important_terms: key vocabulary or syntax with a short definition (at most 20).
- dimensions (per concept): choose ONLY the learning dimensions that genuinely apply. Allowed values and meaning:
  recall = remembering facts, terms, definitions
  understanding = explaining ideas in one's own words
  application = using knowledge in new situations
  reasoning = analysing, comparing, justifying, cause and effect
  calculation = numeric or symbolic computation (only if the concept involves computing)
  procedure = carrying out multi-step methods (only if the concept involves following steps)
- Write values in the same language as the document. JSON keys and dimension values stay in English.
- The material may be excerpted; "[...]" marks omitted parts.
- Return ONLY a JSON object with exactly this structure, with no markdown and no commentary:

{SCHEMA_EXAMPLE}

Teacher-provided context: subject = {subject}; level = {level}.

<material>
{material}
</material>"""