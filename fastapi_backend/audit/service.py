import hashlib
import json
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_backend.database.models import AuditLog
from fastapi_backend.database.session import AsyncSessionLocal
from fastapi_backend.audit.event_bus import AuditEventPayload, audit_event_bus

def compute_audit_hash(actor_id: str, action: str, entity_id: str, timestamp_str: str, after_state_str: str) -> str:
    """Calcula hash criptográfico SHA-256 para garantizar la inmutabilidad de la bitácora"""
    raw = f"{actor_id}:{action}:{entity_id}:{timestamp_str}:{after_state_str}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

class AuditService:
    @staticmethod
    async def handle_audit_event(event: AuditEventPayload):
        """Manejador asíncrono desacoplado que persiste el evento de auditoría"""
        now = datetime.utcnow()
        before_str = json.dumps(event.before_state, default=str) if event.before_state else None
        after_str = json.dumps(event.after_state, default=str) if event.after_state else None
        integrity_hash = compute_audit_hash(
            actor_id=event.actor_id,
            action=event.action,
            entity_id=event.entity_id,
            timestamp_str=now.isoformat(),
            after_state_str=after_str or ""
        )

        async with AsyncSessionLocal() as session:
            try:
                log_entry = AuditLog(
                    id=str(uuid.uuid4()),
                    timestamp=now,
                    actor_id=event.actor_id,
                    actor_email=event.actor_email,
                    actor_role=event.actor_role,
                    action=event.action,
                    entity=event.entity,
                    entity_id=event.entity_id,
                    before_state=before_str,
                    after_state=after_str,
                    ip_address=event.ip_address,
                    integrity_hash=integrity_hash
                )
                session.add(log_entry)
                await session.commit()
            except Exception as e:
                await session.rollback()
                print(f"[AUDIT_ERROR] Error al registrar bitácora inmutable: {e}")

# Suscribir el servicio de auditoría al bus desacoplado
audit_event_bus.subscribe(AuditService.handle_audit_event)
