def test_search_service_contract_shape():
    from pathlib import Path

    content = Path("backend/app/services/semantic_search_service.py").read_text(encoding="utf-8")
    assert "def search" in content
    assert "def index_mom" in content
