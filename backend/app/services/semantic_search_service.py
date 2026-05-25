import uuid

import ollama
try:
    from chromadb import PersistentClient
    from chromadb.config import Settings
except ImportError:
    class PersistentClient:
        def __init__(self, *args, **kwargs): pass
        def get_or_create_collection(self, *args, **kwargs):
            class MockCollection:
                def add(self, *args, **kwargs): pass
                def query(self, *args, **kwargs): return {}
            return MockCollection()
    class Settings:
        def __init__(self, *args, **kwargs): pass
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.models.platform import MOMRecord, SemanticEmbedding


class SemanticSearchService:
    def __init__(self) -> None:
        settings = get_settings()
        self.embedding_model = settings.embedding_model
        self.ollama_client = ollama.Client(host=settings.ollama_host)
        self.client = PersistentClient(
            path=settings.chroma_path,
            settings=Settings(anonymized_telemetry=False)
        )
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

    def search(
        self,
        db: Session,
        query: str,
        limit: int = 10,
        allowed_group_ids: set[int] | None = None,
        types: list[str] | None = None,
    ) -> list[dict]:
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
            if allowed_group_ids is not None and row.group_id not in allowed_group_ids:
                continue
            mom = db.get(MOMRecord, row.mom_id)
            if not mom:
                continue
            results.append(
                {
                    "type": "mom",
                    "id": row.mom_id,
                    "mom_id": row.mom_id,
                    "meeting_id": row.meeting_id,
                    "community_id": row.community_id,
                    "group_id": row.group_id,
                    "title": f"MOM for meeting #{row.meeting_id}",
                    "snippet": mom.generated_text[:300],
                    "score": score_map.get(row.chroma_document_id, 0.0),
                    "url_path": f"/meetings/{row.meeting_id}?tab=minutes",
                }
            )
        if types is None or "meetings" in types or "action_items" in types or "communities" in types or "groups" in types:
            results.extend(self._sql_search(db, query, allowed_group_ids, types))
        return results[:limit]

    def _sql_search(
        self,
        db: Session,
        query: str,
        allowed_group_ids: set[int] | None,
        types: list[str] | None,
    ) -> list[dict]:
        from backend.app.models.platform import ActionItem, Community, Group, Meeting

        q = f"%{query}%"
        hits: list[dict] = []
        if types is None or "meetings" in types:
            stmt = select(Meeting).where(Meeting.title.ilike(q))
            if allowed_group_ids is not None:
                stmt = stmt.where(Meeting.group_id.in_(allowed_group_ids))
            for m in db.scalars(stmt.limit(5)).all():
                hits.append(
                    {
                        "type": "meeting",
                        "id": m.id,
                        "meeting_id": m.id,
                        "title": m.title,
                        "snippet": m.description or m.location,
                        "score": 0.5,
                        "url_path": f"/meetings/{m.id}",
                    }
                )
        if types is None or "action_items" in types:
            stmt = select(ActionItem).join(Meeting, Meeting.id == ActionItem.meeting_id).where(ActionItem.title.ilike(q))
            if allowed_group_ids is not None:
                stmt = stmt.where(Meeting.group_id.in_(allowed_group_ids))
            for a in db.scalars(stmt.limit(5)).all():
                hits.append(
                    {
                        "type": "action_item",
                        "id": a.id,
                        "meeting_id": a.meeting_id,
                        "title": a.title,
                        "snippet": a.description or "",
                        "score": 0.4,
                        "url_path": f"/meetings/{a.meeting_id}?tab=outcomes",
                    }
                )
        if types is None or "communities" in types:
            for c in db.scalars(select(Community).where(Community.name.ilike(q)).limit(3)).all():
                hits.append({"type": "community", "id": c.id, "title": c.name, "snippet": c.description or "", "score": 0.3, "url_path": f"/communities/{c.id}"})
        if types is None or "groups" in types:
            stmt = select(Group).where(Group.name.ilike(q))
            if allowed_group_ids is not None:
                stmt = stmt.where(Group.id.in_(allowed_group_ids))
            for g in db.scalars(stmt.limit(3)).all():
                hits.append({"type": "group", "id": g.id, "title": g.name, "snippet": g.description or "", "score": 0.3, "url_path": f"/groups/{g.id}"})
        return hits
