from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi_backend.database.session import get_db
from fastapi_backend.database.models import User
from fastapi_backend.core.security import verify_password, create_access_token, require_roles, TokenPayload
from fastapi_backend.audit.event_bus import audit_event_bus, AuditEventPayload

router = APIRouter(prefix="/auth", tags=["Autenticación (RF-01)"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de acceso incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo en la plataforma")

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email
    )

    # Disparar auditoría de inicio de sesión
    await audit_event_bus.publish(AuditEventPayload(
        actor_id=user.id,
        actor_email=user.email,
        actor_role=user.role.value,
        action="LOGIN",
        entity="User",
        entity_id=user.id,
        after_state={"email": user.email, "role": user.role.value}
    ))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
        }
    }

@router.get("/me")
async def get_current_user_profile(
    user_payload: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Docente", "Estudiante"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_payload.sub))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
    }
