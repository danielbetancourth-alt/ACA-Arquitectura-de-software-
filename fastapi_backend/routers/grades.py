from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi_backend.database.session import get_db
from fastapi_backend.database.models import Grade, Enrollment, Schedule, Subject, Student, User
from fastapi_backend.services.academic_service import AcademicService
from fastapi_backend.core.security import require_roles, TokenPayload

router = APIRouter(prefix="/grades", tags=["Registro de Calificaciones (RF-08, RF-09)"])

class GradeSubmission(BaseModel):
    enrollment_id: str
    corte_1: Optional[float] = Field(None, ge=0.0, le=5.0, description="Nota Corte 1 (30%)")
    corte_2: Optional[float] = Field(None, ge=0.0, le=5.0, description="Nota Corte 2 (30%)")
    corte_3: Optional[float] = Field(None, ge=0.0, le=5.0, description="Nota Corte 3 (40%)")

@router.get("/by-schedule/{schedule_id}")
async def get_grades_by_schedule(
    schedule_id: str,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Docente"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Enrollment, Student, User, Grade).join(
        Student, Enrollment.student_id == Student.id
    ).join(
        User, Student.user_id == User.id
    ).outerjoin(
        Grade, Enrollment.id == Grade.enrollment_id
    ).where(Enrollment.schedule_id == schedule_id)

    result = await db.execute(query)
    rows = result.all()

    grades_list = []
    for enr, student, user, grade in rows:
        grades_list.append({
            "enrollment_id": enr.id,
            "student_id": student.id,
            "student_code": student.student_code,
            "student_name": user.full_name,
            "student_email": user.email,
            "corte_1": grade.corte_1 if grade else None,
            "corte_2": grade.corte_2 if grade else None,
            "corte_3": grade.corte_3 if grade else None,
            "final_grade": grade.final_grade if grade else None,
            "approved": grade.approved if grade else None,
        })
    return grades_list

@router.post("/register", status_code=status.HTTP_200_OK)
async def register_student_grade(
    payload: GradeSubmission,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Docente"])),
    db: AsyncSession = Depends(get_db)
):
    grade = await AcademicService.register_grades(
        db=db,
        enrollment_id=payload.enrollment_id,
        teacher_id=current_user.sub or "teacher",
        corte_1=payload.corte_1,
        corte_2=payload.corte_2,
        corte_3=payload.corte_3,
        actor_id=current_user.sub or "teacher",
        actor_email=current_user.email or "docente@sga.edu",
        actor_role=current_user.role or "Docente"
    )
    return {
        "message": "Calificaciones registradas exitosamente (escala 0.0 - 5.0)",
        "grade_id": grade.id,
        "corte_1": grade.corte_1,
        "corte_2": grade.corte_2,
        "corte_3": grade.corte_3,
        "final_grade": grade.final_grade,
        "approved": grade.approved
    }
