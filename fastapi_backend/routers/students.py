import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi_backend.database.session import get_db
from fastapi_backend.database.models import Student, User, UserRole, Program
from fastapi_backend.core.security import require_roles, TokenPayload, get_password_hash
from fastapi_backend.audit.event_bus import audit_event_bus, AuditEventPayload

router = APIRouter(prefix="/students", tags=["Gestión de Estudiantes (RF-03)"])

class StudentCreateSchema(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    document_id: str
    student_code: str
    program_id: str
    current_semester: int = 1
    phone: Optional[str] = None

class StudentUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    current_semester: Optional[int] = None

@router.get("/")
async def list_students(
    search: Optional[str] = None,
    program_id: Optional[str] = None,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Docente"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Student, User, Program).join(User, Student.user_id == User.id).join(Program, Student.program_id == Program.id)
    if program_id:
        query = query.where(Student.program_id == program_id)
    result = await db.execute(query)
    rows = result.all()
    
    students_list = []
    for student, user, program in rows:
        if search and search.lower() not in user.full_name.lower() and search.lower() not in student.student_code.lower():
            continue
        students_list.append({
            "id": student.id,
            "student_code": student.student_code,
            "document_id": student.document_id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": student.phone,
            "program_id": program.id,
            "program_name": program.name,
            "current_semester": student.current_semester,
            "gpa": student.gpa,
            "status": student.status,
        })
    return students_list

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreateSchema,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador"])),
    db: AsyncSession = Depends(get_db)
):
    # Validar unicidad
    existing_user = await db.execute(select(User).where(User.email == payload.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado.")

    user_id = str(uuid.uuid4())
    student_id = str(uuid.uuid4())

    new_user = User(
        id=user_id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(new_user)

    new_student = Student(
        id=student_id,
        user_id=user_id,
        student_code=payload.student_code,
        document_id=payload.document_id,
        program_id=payload.program_id,
        current_semester=payload.current_semester,
        phone=payload.phone,
        gpa=0.0,
        status="Regular"
    )
    db.add(new_student)
    await db.flush()

    await audit_event_bus.publish(AuditEventPayload(
        actor_id=current_user.sub or "system",
        actor_email=current_user.email or "system@sga.edu",
        actor_role=current_user.role or "Admin",
        action="CREATE",
        entity="Student",
        entity_id=student_id,
        after_state={"student_code": payload.student_code, "name": payload.full_name, "email": payload.email}
    ))

    return {"message": "Estudiante creado exitosamente", "student_id": student_id}
