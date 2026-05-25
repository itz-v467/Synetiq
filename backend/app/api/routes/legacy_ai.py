from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

from backend.app.auth.dependencies import get_current_user
from backend.app.core.rate_limit import apply_rate_limit
from backend.app.models.user import User
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
async def translate_text(payload: TranslateRequest, _: User = Depends(get_current_user)):
    return translation_service.translate_to_english(payload.text, payload.source_lang)


@router.post("/generate-from-audio")
async def generate_from_audio(
    request: Request,
    audio: UploadFile = File(...),
    meetingInfo: str = Form(default=""),
    _: User = Depends(get_current_user),
):
    await apply_rate_limit(request, "legacy-audio", limit=10, window=60)
    try:
        return await get_pipeline_service().generate_from_audio(audio_file=audio, meeting_info=meetingInfo)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate-from-photo")
async def generate_from_photo(
    request: Request,
    photo: UploadFile = File(...),
    meetingInfo: str = Form(default=""),
    _: User = Depends(get_current_user),
):
    await apply_rate_limit(request, "legacy-photo", limit=10, window=60)
    try:
        return await get_pipeline_service().generate_from_photo(photo_file=photo, meeting_info=meetingInfo)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate-from-points")
async def generate_from_points(
    request: Request,
    payload: GeneratePointsRequest,
    _: User = Depends(get_current_user),
):
    await apply_rate_limit(request, "legacy-points", limit=20, window=60)
    if not payload.points:
        raise HTTPException(status_code=400, detail="No points provided")
    try:
        return await get_pipeline_service().generate_from_points(points=payload.points, meeting_info=payload.meetingInfo)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
