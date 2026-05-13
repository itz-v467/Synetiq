import langdetect
from deep_translator import GoogleTranslator


class TranslationService:
    def detect_language(self, text: str) -> str:
        try:
            return langdetect.detect(text)
        except Exception:
            return "en"

    def translate_to_english(self, text: str, source_lang: str | None = None) -> dict:
        if not text or len(text.strip()) < 3:
            return {"original": text, "translated": text, "language": "en", "translated_from": False}

        try:
            detected_lang = source_lang or self.detect_language(text)
            if detected_lang in {"gu", "hi"}:
                translated_text = GoogleTranslator(source=detected_lang, target="en").translate(text)
                return {
                    "original": text,
                    "translated": translated_text,
                    "language": detected_lang,
                    "translated_from": True,
                }
            return {"original": text, "translated": text, "language": detected_lang, "translated_from": False}
        except Exception as exc:
            return {
                "original": text,
                "translated": text,
                "language": "unknown",
                "translated_from": False,
                "error": str(exc),
            }
