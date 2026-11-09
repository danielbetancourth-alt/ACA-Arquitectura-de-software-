import asyncio
import json
import hashlib
import uuid
from datetime import datetime
from typing import Callable, Coroutine, Any, Optional
from pydantic import BaseModel

class AuditEventPayload(BaseModel):
    actor_id: str
    actor_email: str
    actor_role: str
    action: str # CREATE, UPDATE, DELETE, ENROLL, GRADE_MUTATION, LOGIN
    entity: str # Student, Teacher, Grade, Enrollment, Schedule, Subject
    entity_id: str
    before_state: Optional[dict[str, Any]] = None
    after_state: Optional[dict[str, Any]] = None
    ip_address: Optional[str] = "127.0.0.1"

class AuditEventBus:
    """
    Bus de eventos desacoplado en memoria (Monolito Modular).
    Permite que la lógica de negocio emita eventos sin acoplarse
    directamente al almacenamiento o motor de persistencia de auditoría.
    """
    def __init__(self):
        self._listeners: list[Callable[[AuditEventPayload], Coroutine[Any, Any, None]]] = []

    def subscribe(self, listener: Callable[[AuditEventPayload], Coroutine[Any, Any, None]]):
        self._listeners.append(listener)

    async def publish(self, event: AuditEventPayload):
        # Despacho concurrente no bloqueante para cumplir con RNF-02 (<3s de latencia)
        for listener in self._listeners:
            asyncio.create_task(listener(event))

audit_event_bus = AuditEventBus()
