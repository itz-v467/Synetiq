import json

import ollama
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.models.platform import MOMRecord
from backend.app.services.ai_pipeline_service import AIPipelineService

QUALITY_PROMPT = """
You are a QA reviewer for meeting minutes. Review the MOM below and identify any gaps.

=== GENERATED MOM ===
{generated_mom}

=== ORIGINAL AGENDA ITEMS ===
{agenda_items}

Check for these issues:
1. Agenda items with no corresponding discussion summary
2. Action items missing an owner name
3. Action items missing a deadline
4. Decisions that are too vague to be actionable

Return ONLY valid JSON. No explanation:
{{
  "missing_agenda_coverage": ["string"],
  "incomplete_action_items": [{{"item": "string", "issue": "string"}}],
  "vague_decisions": ["string"],
  "quality_score": "good"
}}
"""


class MOMService:
    def __init__(self) -> None:
        self.pipeline: AIPipelineService | None = None
        settings = get_settings()
        self.ollama_client = ollama.Client(host=settings.ollama_host)

    def _pipeline(self) -> AIPipelineService:
        if self.pipeline is None:
            self.pipeline = AIPipelineService()
        return self.pipeline

    def generate_from_text(self, db: Session, meeting_id: int, transcript_or_notes: str, meeting_info: str = "") -> MOMRecord:
        mom_text = self._pipeline().generate_mom(transcript_or_notes, meeting_info)
        quality_report = self._quality_check(mom_text, "")
        record = MOMRecord(meeting_id=meeting_id, generated_text=mom_text, generated_html=mom_text, quality_report=quality_report)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def _quality_check(self, generated_mom: str, agenda_items: str) -> dict:
        try:
            response = self.ollama_client.chat(
                model="llama3.2",
                messages=[{"role": "user", "content": QUALITY_PROMPT.format(generated_mom=generated_mom, agenda_items=agenda_items)}],
            )
            content = response.message.content if hasattr(response, "message") else response["message"]["content"]
            return json.loads(content)
        except Exception:
            return {"missing_agenda_coverage": [], "incomplete_action_items": [], "vague_decisions": [], "quality_score": "needs_review"}

