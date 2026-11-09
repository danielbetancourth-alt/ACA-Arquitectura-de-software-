from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi_backend.database.session import get_db
from fastapi_backend.database.models import AuditLog
from fastapi_backend.core.security import require_roles, TokenPayload

router = APIRouter(prefix="/audit", tags=["Bitácora de Auditoría Desacoplada (RF-12, RNF-10)"])

@router.get("/logs")
async def get_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    limit: int = 50,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Consulta la bitácora inmutable de mutaciones de datos.
    Solo accesible para roles de Administración y Auditoría.
    """
    query = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    if action:
        query = query.where(AuditLog.action == action)
    if entity:
        query = query.where(AuditLog.entity == entity)

    result = await db.execute(query)
    logs = result.scalars().all()
    return logs
