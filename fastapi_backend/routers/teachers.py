import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi_backend.database.session import get_db
from fastapi_backend.database.models import Teacher, User, UserRole
from fastapi_backend.core.security import require_roles, TokenPayload, get_password_hash
from fastapi_backend.audit.event_bus import audit_event_bus, AuditEventPayload

router = APIRouter(prefix="/teachers", tags=["Gestión de Docentes (RF-04)"])

class TeacherCreateSchema(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    employee_code: str
    department: str
    specialty: str
    academic_degree: str
    contract_type: str = "Tiempo Completo"

@router.get("/")
async def list_teachers(
    department: Optional[str] = None,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Docente"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Teacher, User).join(User, Teacher.user_id == User.id)
    if department:
        query = query.where(Teacher.department == department)
    result = await db.execute(query)
    rows = result.all()

    teachers = []
    for teacher, user in rows:
        teachers.append({
            "id": teacher.id,
            "employee_code": teacher.employee_code,
            "full_name": user.full_name,
            "email": user.email,
            "department": teacher.department,
            "specialty": teacher.specialty,
            "academic_degree": teacher.academic_degree,
            "contract_type": teacher.contract_type,
            "is_active": user.is_active,
        })
    return teachers

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_teacher(
    payload: TeacherCreateSchema,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador"])),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado.")

    user_id = str(uuid.uuid4())
    teacher_id = str(uuid.uuid4())

    new_user = User(
        id=user_id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=UserRole.TEACHER,
        is_active=True
    )
    db.add(new_user)

    new_teacher = Teacher(
        id=teacher_id,
        user_id=user_id,
        employee_code=payload.employee_code,
        department=payload.department,
        specialty=payload.specialty,
        academic_degree=payload.academic_degree,
        contract_type=payload.contract_type
    )
    db.add(new_teacher)
    await db.flush()

    await audit_event_bus.publish(AuditEventPayload(
        actor_id=current_user.sub or "system",
        actor_email=current_user.email or "coord@sga.edu",
        actor_role=current_user.role or "Coordinador",
        action="CREATE",
        entity="Teacher",
        entity_id=teacher_id,
        after_state={"employee_code": payload.employee_code, "name": payload.full_name, "department": payload.department}
    ))

    return {"message": "Docente registrado con éxito", "teacher_id": teacher_id}
