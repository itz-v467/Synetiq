def test_legacy_routes_exist():
    from pathlib import Path

    content = Path("backend/app/api/routes/legacy_ai.py").read_text(encoding="utf-8")
    assert '@router.post("/translate")' in content
    assert '@router.post("/generate-from-audio")' in content
    assert '@router.post("/generate-from-points")' in content
