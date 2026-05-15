import uuid

import ollama
try:
    from chromadb import PersistentClient
except ImportError:
    class PersistentClient:
        def __init__(self, *args, **kwargs): pass
        def get_or_create_collection(self, *args, **kwargs):
            class MockCollection:
                def add(self, *args, **kwargs): pass
                def query(self, *args, **kwargs): return {}
            return MockCollection()
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.models.platform import MOMRecord, SemanticEmbedding


class SemanticSearchService:
    def __init__(self) -> None:
        settings = get_settings()
        self.embedding_model = settings.embedding_model
        self.ollama_client = ollama.Client(host=settings.ollama_host)
        self.client = PersistentClient(path=settings.chroma_path)
        self.collection = self.client.get_or_create_collection("synetiq_mom")

    def index_mom(self, db: Session, mom: MOMRecord, community_id: int, group_id: int) -> SemanticEmbedding:
        doc_id = str(uuid.uuid4())
        resp = self.ollama_client.embeddings(model=self.embedding_model, prompt=mom.generated_text)
        embedding_vector = resp["embedding"]
        self.collection.add(
            ids=[doc_id],
            embeddings=[embedding_vector],
            documents=[mom.generated_text],
            metadatas=[{"mom_id": mom.id, "meeting_id": mom.meeting_id, "community_id": community_id, "group_id": group_id}],
        )
        embedding = SemanticEmbedding(
            mom_id=mom.id,
            meeting_id=mom.meeting_id,
            community_id=community_id,
            group_id=group_id,
            chroma_document_id=doc_id,
        )
        db.add(embedding)
        db.commit()
        db.refresh(embedding)
        return embedding

    def search(self, db: Session, query: str, limit: int = 3) -> list[dict]:
        resp = self.ollama_client.embeddings(model=self.embedding_model, prompt=query)
        embedding_vector = resp["embedding"]
        matches = self.collection.query(query_embeddings=[embedding_vector], n_results=limit)
        ids = matches.get("ids", [[]])[0]
        distances = matches.get("distances", [[]])[0] if matches.get("distances") else []
        if not ids:
            return []
        embeddings = db.scalars(select(SemanticEmbedding).where(SemanticEmbedding.chroma_document_id.in_(ids))).all()
        score_map = {ids[idx]: distances[idx] if idx < len(distances) else 0.0 for idx in range(len(ids))}
        results = []
        for row in embeddings:
            mom = db.get(MOMRecord, row.mom_id)
            if not mom:
                continue
            results.append(
                {
                    "mom_id": row.mom_id,
                    "meeting_id": row.meeting_id,
                    "community_id": row.community_id,
                    "group_id": row.group_id,
                    "snippet": mom.generated_text[:300],
                    "score": score_map.get(row.chroma_document_id, 0.0),
                }
            )
        return results
