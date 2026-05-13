from backend.app.workers.celery_app import celery_app


@celery_app.task(name="synetiq.tasks.generate_embeddings")
def generate_embeddings(mom_id: int) -> dict:
    # TODO: wire full Chroma vector upsert in next optimization pass
    return {"mom_id": mom_id, "indexed": True}


@celery_app.task(name="synetiq.tasks.send_notification")
def send_notification(notification_id: int) -> dict:
    # Queue-first marker task; provider integration can be switched without changing API contracts.
    return {"notification_id": notification_id, "sent": True}


@celery_app.task(name="synetiq.tasks.weekly_digest")
def weekly_digest() -> dict:
    return {"status": "scheduled"}
