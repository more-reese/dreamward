#!/usr/bin/env python3
"""Show that Interpret and Compare share one 10-request-per-hour budget.

The model client is replaced with a stub, so this does not call Anthropic
and does not need a real API key.

    python tests/test_rate_limit.py
"""
import os
import sys
from pathlib import Path

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-not-used")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import api_server
from fastapi.testclient import TestClient

_calls = []


class _Block:
    def __init__(self, text):
        self.text = text


class _Message:
    def __init__(self, text):
        self.content = [_Block(text)]


def _fake_create(**kwargs):
    _calls.append(kwargs.get("model"))
    if kwargs.get("system"):
        return _Message('{"narrative":"A dream.","symbols":[],"themes":[],"questions":[]}')
    return _Message("Shared theme.\n\nA second paragraph.")


api_server.client.messages.create = _fake_create

_client = TestClient(api_server.app)
_INTERPRET = {"dream_text": "I was flying over water.", "tradition": {"name": "Freud"}}
_COMPARE = {"traditions": [{"name": "Freud"}, {"name": "Jung"}]}


def _reset():
    _calls.clear()
    api_server._request_log.clear()


def _interpret(headers):
    response = _client.post("/api/interpret-dream", json=_INTERPRET, headers=headers)
    return response.status_code, response.json()


def _compare(headers):
    response = _client.post("/api/compare-summary", json=_COMPARE, headers=headers)
    return response.status_code, response.json()


def _fill(post, headers, count):
    for n in range(count):
        status, body = post(headers)
        assert status == 200, f"request {n + 1} returned {status}: {body}"


def test_interpret_trips_at_the_hourly_limit():
    _reset()
    headers = {"X-Forwarded-For": "203.0.113.10"}
    _fill(_interpret, headers, api_server.RATE_LIMIT)
    assert len(_calls) == api_server.RATE_LIMIT
    status, body = _interpret(headers)
    assert status == 429, body
    assert "10" in body["detail"]
    assert len(_calls) == api_server.RATE_LIMIT, "rejected interpret request must not call the model"


def test_compare_trips_at_the_hourly_limit():
    _reset()
    headers = {"X-Forwarded-For": "203.0.113.11"}
    _fill(_compare, headers, api_server.RATE_LIMIT)
    assert len(_calls) == api_server.RATE_LIMIT
    status, body = _compare(headers)
    assert status == 429, body
    assert body["detail"] == (
        "Rate limit exceeded. You've made 10 requests this hour. Please try again later."
    )
    assert len(_calls) == api_server.RATE_LIMIT, "rejected compare request must not call the model"


def test_interpret_and_compare_share_one_budget():
    _reset()
    headers = {"X-Forwarded-For": "203.0.113.12, 10.0.0.4"}
    same_visitor = {"X-Forwarded-For": "203.0.113.12, 10.0.0.9"}
    _fill(_interpret, headers, 6)
    _fill(_compare, same_visitor, 4)
    assert len(_calls) == api_server.RATE_LIMIT
    interpret_status, interpret_body = _interpret(headers)
    compare_status, compare_body = _compare(same_visitor)
    assert interpret_status == 429, interpret_body
    assert compare_status == 429, compare_body
    assert len(_calls) == api_server.RATE_LIMIT

    # A different visitor still has a full budget on both endpoints.
    other = {"X-Forwarded-For": "203.0.113.99"}
    assert _interpret(other)[0] == 200
    assert _compare(other)[0] == 200


def test_limit_falls_back_to_the_direct_client_address():
    _reset()
    direct = TestClient(api_server.app, client=("198.51.100.40", 50000))
    for _ in range(api_server.RATE_LIMIT):
        response = direct.post("/api/compare-summary", json=_COMPARE)
        assert response.status_code == 200, response.text
    blocked = direct.post("/api/interpret-dream", json=_INTERPRET)
    assert blocked.status_code == 429, blocked.text
    # The default TestClient address is a different visitor.
    assert _compare({})[0] == 200


def test_old_requests_age_out_of_the_window():
    _reset()
    ip = "198.51.100.20"
    api_server._request_log[ip] = [0.0] * api_server.RATE_LIMIT
    status, body = _compare({"X-Forwarded-For": ip})
    assert status == 200, body


def test_healthcheck_is_not_counted():
    _reset()
    for _ in range(api_server.RATE_LIMIT + 5):
        assert _client.get("/").status_code == 200
    assert _compare({"X-Forwarded-For": "203.0.113.70"})[0] == 200


def main():
    tests = [
        test_interpret_trips_at_the_hourly_limit,
        test_compare_trips_at_the_hourly_limit,
        test_interpret_and_compare_share_one_budget,
        test_limit_falls_back_to_the_direct_client_address,
        test_old_requests_age_out_of_the_window,
        test_healthcheck_is_not_counted,
    ]
    failed = 0
    for test in tests:
        try:
            test()
        except Exception as exc:
            failed += 1
            print(f"FAIL {test.__name__}: {exc}")
        else:
            print(f"ok   {test.__name__}")
    if failed:
        print(f"{failed} test(s) failed")
        return 1
    print("rate limit trips on Interpret and Compare (shared 10/hour budget)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
