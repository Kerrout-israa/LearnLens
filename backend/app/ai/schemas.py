from collections import Counter
from typing import Annotated, Literal, TypeVar

from pydantic import BaseModel, BeforeValidator, Field, computed_field, model_validator

Dimension = Literal[
    "recall", "understanding", "application", "reasoning", "calculation", "procedure"
]
Difficulty = Literal["easy", "medium", "hard"]
T = TypeVar("T")


def _none_to_empty(v):
    return "" if v is None else v


def _none_to_list(v):
    return [] if v is None else v


def _to_str_list(v):
    if v is None:
        return []
    if isinstance(v, str):
        return [v] if v.strip() else []
    return v


def _to_dimensions(v):
    out = []
    for d in _to_str_list(v):
        d = d.strip().lower() if isinstance(d, str) else d
        if d not in out:
            out.append(d)
    return out


def _to_difficulty(v):
    if isinstance(v, str) and v.strip().lower() in ("easy", "medium", "hard"):
        return v.strip().lower()
    return None


# Lenient types: the model sometimes returns null, or a single string instead of a list.
Text = Annotated[str, BeforeValidator(_none_to_empty)]
StrList = Annotated[list[str], BeforeValidator(_to_str_list)]
Dimensions = Annotated[list[Dimension], BeforeValidator(_to_dimensions)]
OptDifficulty = Annotated[Difficulty | None, BeforeValidator(_to_difficulty)]
OptList = Annotated[list[T], BeforeValidator(_none_to_list)]


class Concept(BaseModel):
    title: str = Field(min_length=1)
    explanation: Text = ""
    examples: StrList = []
    learning_objectives: StrList = []
    dimensions: Dimensions = []


class Exercise(BaseModel):
    title: Text = ""
    instructions: StrList = []
    difficulty: OptDifficulty = None


class Solution(BaseModel):
    exercise: Text = ""
    answer: Text = ""


class Project(BaseModel):
    title: Text = ""
    description: Text = ""
    requirements: StrList = []


class Homework(BaseModel):
    title: Text = ""
    tasks: StrList = []


class Term(BaseModel):
    term: str = Field(min_length=1)
    definition: Text = ""

    @model_validator(mode="before")
    @classmethod
    def _from_plain_string(cls, data):
        return {"term": data} if isinstance(data, str) else data


class ContentAnalysis(BaseModel):
    title: str | None = None
    subject: str | None = None
    summary: str | None = None
    concepts: OptList[Concept]  # required: also marks old-format stored analyses as stale
    exercises: OptList[Exercise] = []
    solutions: OptList[Solution] = []
    projects: OptList[Project] = []
    homework: OptList[Homework] = []
    important_terms: OptList[Term] = []

    @computed_field
    @property
    def recommended_dimensions(self) -> list[str]:
        counts = Counter(d for c in self.concepts for d in c.dimensions)
        return [d for d, _ in counts.most_common()]