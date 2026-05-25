import json
import re
from datetime import date, timedelta

from sqlalchemy.orm import Session

from backend.app.models.platform import ActionItem, ActionItemStatus, Meeting, MeetingDecision, MeetingTranscript, MOMRecord, TranscriptSource
from backend.app.models.user import User
from backend.app.services.ai_pipeline_service import AIPipelineService
from backend.app.services.mom_service import MOMService


class MeetingIntelligenceService:
  def __init__(self) -> None:
    self.mom_service = MOMService()
    self.pipeline: AIPipelineService | None = None

  def _pipeline(self) -> AIPipelineService:
    if self.pipeline is None:
      self.pipeline = AIPipelineService()
    return self.pipeline

  def save_transcript(self, db: Session, meeting_id: int, content: str, source: TranscriptSource, actor: User, filename: str | None = None) -> MeetingTranscript:
    row = MeetingTranscript(
      meeting_id=meeting_id,
      source=source,
      content=content,
      created_by_id=actor.id,
      filename=filename,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

  def generate_mom(self, db: Session, meeting: Meeting, transcript_or_notes: str, meeting_info: str = "") -> MOMRecord:
    record = self.mom_service.generate_from_text(db, meeting.id, transcript_or_notes, meeting_info)
    self._extract_outcomes(db, meeting, record.generated_text, record.id)
    return record

  def _extract_outcomes(self, db: Session, meeting: Meeting, mom_text: str, mom_id: int) -> None:
    action_pattern = re.compile(r"(?i)action\s*item[:\-]?\s*(.+?)(?:\n|$)")
    decision_pattern = re.compile(r"(?i)decision[:\-]?\s*(.+?)(?:\n|$)")
    
    in_actions = False
    in_decisions = False
    
    for line in mom_text.split("\n"):
      line = line.strip()
      if not line:
        continue
      
      upper_line = line.upper()
      if "ACTION ITEMS" in upper_line:
        in_actions = True
        in_decisions = False
        continue
      elif "KEY DECISIONS" in upper_line or "DECISIONS" in upper_line:
        in_decisions = True
        in_actions = False
        continue
      elif any(x in upper_line for x in ["NEXT STEPS", "CLOSING", "AGENDA", "DISCUSSION SUMMARY", "MEETING INFORMATION"]):
        in_actions = False
        in_decisions = False
        
      # Common skip logic for dividers
      if line.startswith("───") or line.startswith("---") or line.startswith("==="):
        continue
        
      if in_actions:
        # Skip table headers
        if "No." in line and "Task" in line:
          continue
          
        title = ""
        if "|" in line:
          parts = [p.strip() for p in line.split("|") if p.strip()]
          if len(parts) >= 2:
            title = parts[1] if parts[0].isdigit() else parts[0]
        elif line.startswith("•") or line.startswith("-") or line.startswith("*"):
          title = line[1:].strip()
        else:
          match = action_pattern.search(line)
          if match:
            title = match.group(1).strip()
          elif re.match(r"^\d+\.\s*(.+)", line):
            title = re.match(r"^\d+\.\s*(.+)", line).group(1).strip()
            
        if title:
          existing = db.query(ActionItem).filter(ActionItem.meeting_id == meeting.id, ActionItem.title == title[:255]).first()
          if not existing:
            db.add(
              ActionItem(
                meeting_id=meeting.id,
                mom_id=mom_id,
                title=title[:255],
                assigned_to_id=meeting.organizer_id,
                due_date=date.today() + timedelta(days=7),
                status=ActionItemStatus.OPEN,
              )
            )

      elif in_decisions:
        text = ""
        if line.startswith("•") or line.startswith("-") or line.startswith("*"):
          text = line[1:].strip()
        else:
          match = decision_pattern.search(line)
          if match:
            text = match.group(1).strip()
          elif re.match(r"^\d+\.\s*(.+)", line):
            text = re.match(r"^\d+\.\s*(.+)", line).group(1).strip()
          elif len(line) > 5 and not line.isupper():
            text = line
            
        if text:
          db.add(MeetingDecision(meeting_id=meeting.id, decision_text=text[:500], created_by_id=meeting.organizer_id))
          
      # Fallback to simple regex if not in sections
      else:
        match = action_pattern.search(line)
        if match:
          title = match.group(1).strip()[:255]
          if title:
            existing = db.query(ActionItem).filter(ActionItem.meeting_id == meeting.id, ActionItem.title == title).first()
            if not existing:
              db.add(
                ActionItem(
                  meeting_id=meeting.id,
                  mom_id=mom_id,
                  title=title,
                  assigned_to_id=meeting.organizer_id,
                  due_date=date.today() + timedelta(days=7),
                  status=ActionItemStatus.OPEN,
                )
              )
        match = decision_pattern.search(line)
        if match:
          text = match.group(1).strip()
          if text:
            db.add(MeetingDecision(meeting_id=meeting.id, decision_text=text[:500], created_by_id=meeting.organizer_id))

    db.commit()

  async def generate_from_audio(self, db: Session, meeting: Meeting, audio_file, meeting_info: str = "", actor: User | None = None) -> dict:
    result = await self._pipeline().generate_from_audio(audio_file=audio_file, meeting_info=meeting_info)
    user = actor or db.get(User, meeting.organizer_id)
    if result.get("transcript") and user:
      self.save_transcript(db, meeting.id, result["transcript"], TranscriptSource.UPLOAD, user, audio_file.filename if hasattr(audio_file, "filename") else None)
    if result.get("mom"):
      record = MOMRecord(
        meeting_id=meeting.id,
        generated_text=result["mom"],
        generated_html=result["mom"],
        quality_report={"source": "audio"},
        is_published=False,
      )
      db.add(record)
      db.commit()
      db.refresh(record)
      self._extract_outcomes(db, meeting, result["mom"], record.id)
      result["mom_id"] = record.id
    return result
