import pytest

from app.ai import client
from app.ai.schemas import ContentAnalysis

VALID = (
    '{"title":"Session 2","subject":"Python","summary":null,'
    '"concepts":[{"title":"Variables","explanation":"Named values.","examples":["x = 5"],'
    '"learning_objectives":["Create variables"],"dimensions":["Understanding"]}],'
    '"exercises":[],"solutions":null,"projects":[],"homework":[],'
    '"important_terms":["variable"]}'
)


def test_invalid_then_valid_retries_once(monkeypatch):
    replies = iter(["not json at all", VALID])
    monkeypatch.setattr(client, "_complete", lambda prompt, system=None: next(replies))
    result = client.generate_json("p", ContentAnalysis)
    assert result.title == "Session 2"
    assert result.recommended_dimensions == ["understanding"]  # normalized to lowercase
    assert result.important_terms[0].term == "variable"  # plain string accepted
    assert result.solutions == []  # null becomes empty list


def test_two_invalid_replies_raise_controlled_error(monkeypatch):
    calls = []

    def fake(prompt, system=None):
        calls.append(prompt)
        return "still not json"

    monkeypatch.setattr(client, "_complete", fake)
    with pytest.raises(client.AIError) as exc:
        client.generate_json("p", ContentAnalysis)
    assert exc.value.status_code == 502
    assert len(calls) == 2  # original + exactly one retry


def test_markdown_fenced_json_is_accepted(monkeypatch):
    monkeypatch.setattr(
        client, "_complete", lambda prompt, system=None: "```json\n" + VALID + "\n```"
    )
    assert client.generate_json("p", ContentAnalysis).title == "Session 2"