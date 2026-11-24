"""End-to-end API behaviour against a real database.

P3.15 adds the first two tests. The rest of the manual's test_api.py (games, jobs, practice,
delete-my-data) is added in the later phases that build those features.
"""


def test_health(client):
    assert client.get("/health/live").json() == {"status": "ok"}
    assert client.get("/health/ready").status_code == 200


def test_private_routes_need_a_token(client):
    # /v1/me is the only private route in P3. Switch this to /v1/games once P6 adds the games router.
    response = client.get("/v1/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"
