import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailSender:
  def send(self, to_email: str, subject: str, body_html: str) -> bool:
    settings = get_settings()
    if not settings.smtp_enabled:
      logger.info("smtp_disabled", extra={"to": to_email, "subject": subject})
      return True
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.attach(MIMEText(body_html, "html"))
    try:
      with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
        if settings.smtp_tls:
          server.starttls()
        if settings.smtp_user and settings.smtp_password:
          server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, [to_email], msg.as_string())
      return True
    except Exception as exc:
      logger.exception("email_send_failed", extra={"to": to_email, "error": str(exc)})
      return False
