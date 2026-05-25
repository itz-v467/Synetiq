import os
import re
import tempfile
from pathlib import Path

import ollama
import whisper
from fastapi import UploadFile

from backend.app.ai.mom_prompt import MOM_SYSTEM_PROMPT
from backend.app.core.config import get_settings
from backend.app.services.translation_service import TranslationService


class AIPipelineService:
    def __init__(self) -> None:
        settings = get_settings()
        self.translation_service = TranslationService()
        self.ollama_model = settings.ollama_model
        self.ollama_client = ollama.Client(host=settings.ollama_host)
        self.whisper_model = whisper.load_model(settings.whisper_model_name)
        self._ensure_ffmpeg_paths()

    @staticmethod
    def _ensure_ffmpeg_paths() -> None:
        ffmpeg_paths = [
            r"C:\ffmpeg\ffmpeg-7.1-essentials_build\bin",
            r"C:\ffmpeg\ffmpeg-7.0-essentials_build\bin",
            r"C:\ffmpeg\bin",
            r"C:\Program Files\ffmpeg\bin",
        ]
        for path in ffmpeg_paths:
            if os.path.exists(path):
                os.environ["PATH"] += os.pathsep + path
                return

    @staticmethod
    def clean_transcript(text: str) -> str:
        fillers = ["um", "uh", "you know", "basically", "literally", "i mean", "like so", "right so", "kind of", "sort of"]
        cleaned = text
        for word in fillers:
            cleaned = re.sub(r"\b" + re.escape(word) + r"\b", "", cleaned, flags=re.IGNORECASE)
        return re.sub(r" +", " ", cleaned).strip()

    def generate_mom(self, content: str, meeting_info: str = "") -> str:
        msg = f"Meeting Details:\n{meeting_info}\n\n" if meeting_info else ""
        msg += f"Create MOM from this content:\n\n{content}"
        response = self.ollama_client.chat(
            model=self.ollama_model,
            messages=[{"role": "system", "content": MOM_SYSTEM_PROMPT}, {"role": "user", "content": msg}],
        )
        if hasattr(response, "message"):
            return response.message.content
        return response["message"]["content"]

    async def generate_from_audio(self, audio_file: UploadFile, meeting_info: str = "") -> dict:
        suffix = Path(audio_file.filename or "audio.mp3").suffix or ".mp3"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            payload = await audio_file.read()
            tmp.write(payload)
            tmp_path = tmp.name

        try:
            result = self.whisper_model.transcribe(tmp_path)
            transcript = self.clean_transcript(result["text"])
            translation = self.translation_service.translate_to_english(transcript)
            translated_text = translation["translated"]
            mom = self.generate_mom(translated_text, meeting_info)
            was_translated = translation.get("translated_from", False)
            return {
                "success": True,
                "transcript": transcript,
                "transcript_language": translation["language"],
                "translated_transcript": translated_text if was_translated else None,
                "was_translated": was_translated,
                "mom": mom,
            }
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    async def generate_from_photo(self, photo_file: UploadFile, meeting_info: str = "") -> dict:
        import base64
        photo_bytes = await photo_file.read()
        photo_base64 = base64.b64encode(photo_bytes).decode("utf-8")
        
        msg = f"Meeting Details:\n{meeting_info}\n\n" if meeting_info else ""
        msg += "Create MOM from this handwritten or whiteboard note image. Summarize the points."
        
        response = self.ollama_client.chat(
            model="llama3.2-vision",
            messages=[
                {"role": "system", "content": MOM_SYSTEM_PROMPT}, 
                {"role": "user", "content": msg, "images": [photo_base64]}
            ],
        )
        if hasattr(response, "message"):
            mom = response.message.content
        else:
            mom = response["message"]["content"]
            
        return {
            "success": True,
            "transcript": "Processed via vision model.",
            "was_translated": False,
            "mom": mom,
        }

    async def generate_from_points(self, points: list[str], meeting_info: str = "") -> dict:
        translated_points: list[str] = []
        was_translated = False
        for point in points:
            result = self.translation_service.translate_to_english(point)
            translated_points.append(result["translated"])
            if result.get("translated_from", False):
                was_translated = True

        points_text = "\n".join([f"{idx + 1}. {point.strip()}" for idx, point in enumerate(translated_points) if point.strip()])
        mom = self.generate_mom(f"Key Discussion Points:\n{points_text}", meeting_info)
        return {
            "success": True,
            "original_points": points,
            "translated_points": translated_points if was_translated else None,
            "was_translated": was_translated,
            "mom": mom,
        }
