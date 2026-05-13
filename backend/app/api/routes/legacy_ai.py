from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from backend.app.services.ai_pipeline_service import AIPipelineService
from backend.app.services.translation_service import TranslationService

router = APIRouter(tags=["legacy-ai"])
translation_service = TranslationService()
pipeline_service: AIPipelineService | None = None


def get_pipeline_service() -> AIPipelineService:
    global pipeline_service
    if pipeline_service is None:
        pipeline_service = AIPipelineService()
    return pipeline_service


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1)
    source_lang: str | None = None


class GeneratePointsRequest(BaseModel):
    points: list[str]
    meetingInfo: str = ""


@router.post("/translate")
async def translate_text(payload: TranslateRequest):
    return translation_service.translate_to_english(payload.text, payload.source_lang)


@router.post("/generate-from-audio")
async def generate_from_audio(audio: UploadFile = File(...), meetingInfo: str = Form(default="")):
    try:
        return await get_pipeline_service().generate_from_audio(audio_file=audio, meeting_info=meetingInfo)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate-from-points")
async def generate_from_points(payload: GeneratePointsRequest):
    if not payload.points:
        raise HTTPException(status_code=400, detail="No points provided")
    try:
        return await get_pipeline_service().generate_from_points(points=payload.points, meeting_info=payload.meetingInfo)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
