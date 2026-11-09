from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi_backend.database.session import get_db
from fastapi_backend.database.models import Program, Subject, AcademicPeriod, Schedule, Teacher, User
from fastapi_backend.services.academic_service import AcademicService
from fastapi_backend.core.security import require_roles, TokenPayload

router = APIRouter(prefix="/academic", tags=["Gestión Académica & Matrícula (RF-05, RF-06, RF-07)"])

class EnrollmentRequest(BaseModel):
    student_id: str
    schedule_id: str

@router.get("/programs")
async def list_programs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Program).where(Program.is_active == True))
    return result.scalars().all()

@router.get("/subjects")
async def list_subjects(program_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Subject)
    if program_id:
        query = query.where(Subject.program_id == program_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/periods")
async def list_periods(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AcademicPeriod))
    return result.scalars().all()

@router.get("/schedules")
async def list_schedules(period_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Schedule, Subject, Teacher, User).join(
        Subject, Schedule.subject_id == Subject.id
    ).join(
        Teacher, Schedule.teacher_id == Teacher.id
    ).join(
        User, Teacher.user_id == User.id
    )
    if period_id:
        query = query.where(Schedule.period_id == period_id)
    
    result = await db.execute(query)
    rows = result.all()

    schedules_data = []
    for schedule, subject, teacher, user in rows:
        available_quota = schedule.total_quota - schedule.enrolled_count
        schedules_data.append({
            "id": schedule.id,
            "period_id": schedule.period_id,
            "subject_id": subject.id,
            "subject_code": subject.code,
            "subject_name": subject.name,
            "credits": subject.credits,
            "semester": subject.semester,
            "teacher_id": teacher.id,
            "teacher_name": user.full_name,
            "classroom": schedule.classroom,
            "day_of_week": schedule.day_of_week,
            "start_time": schedule.start_time,
            "end_time": schedule.end_time,
            "total_quota": schedule.total_quota,
            "enrolled_count": schedule.enrolled_count,
            "available_quota": available_quota,
            "is_full": available_quota <= 0,
        })
    return schedules_data

@router.post("/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_student(
    payload: EnrollmentRequest,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Estudiante"])),
    db: AsyncSession = Depends(get_db)
):
    """
    RF-07 & RNF-03: Matrícula atómica con bloqueo de concurrencia y validación de cupos.
    """
    enrollment = await AcademicService.enroll_student_atomic(
        db=db,
        student_id=payload.student_id,
        schedule_id=payload.schedule_id,
        actor_id=current_user.sub or "unknown",
        actor_email=current_user.email or "unknown@sga.edu",
        actor_role=current_user.role or "Estudiante"
    )
    return {
        "message": "Matrícula realizada exitosamente con verificación de cupo atómica.",
        "enrollment_id": enrollment.id,
        "schedule_id": enrollment.schedule_id,
        "status": enrollment.status.value
    }
