from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi_backend.database.session import get_db
from fastapi_backend.database.models import Student, User, Program, Enrollment, Schedule, Subject, Grade
from fastapi_backend.core.security import require_roles, TokenPayload

router = APIRouter(prefix="/reports", tags=["Reportes y Boletines Académicos (RF-09, RF-10)"])

@router.get("/transcript/{student_id}")
async def get_student_transcript(
    student_id: str,
    current_user: TokenPayload = Depends(require_roles(["Admin", "Coordinador", "Docente", "Estudiante"])),
    db: AsyncSession = Depends(get_db)
):
    # Buscar estudiante
    stu_res = await db.execute(
        select(Student, User, Program).join(
            User, Student.user_id == User.id
        ).join(
            Program, Student.program_id == Program.id
        ).where(Student.id == student_id)
    )
    row = stu_res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    student, user, program = row

    # Obtener historial de matrículas y calificaciones
    enr_res = await db.execute(
        select(Enrollment, Schedule, Subject, Grade).join(
            Schedule, Enrollment.schedule_id == Schedule.id
        ).join(
            Subject, Schedule.subject_id == Subject.id
        ).outerjoin(
            Grade, Enrollment.id == Grade.enrollment_id
        ).where(Enrollment.student_id == student_id)
    )
    enr_rows = enr_res.all()

    subjects_history = []
    total_weighted_points = 0.0
    total_credits = 0

    for enr, sch, subj, gr in enr_rows:
        grade_val = gr.final_grade if gr and gr.final_grade is not None else 0.0
        approved = gr.approved if gr and gr.approved is not None else False
        credits = subj.credits

        if gr and gr.final_grade is not None:
            total_weighted_points += grade_val * credits
            total_credits += credits

        subjects_history.append({
            "subject_code": subj.code,
            "subject_name": subj.name,
            "credits": credits,
            "semester": subj.semester,
            "corte_1": gr.corte_1 if gr else None,
            "corte_2": gr.corte_2 if gr else None,
            "corte_3": gr.corte_3 if gr else None,
            "final_grade": gr.final_grade if gr else None,
            "approved": approved,
            "status": enr.status.value
        })

    cumulative_gpa = round(total_weighted_points / total_credits, 2) if total_credits > 0 else 0.0

    return {
        "institution": "UNIVERSIDAD SGA - SISTEMA DE GESTIÓN ACADÉMICA",
        "student": {
            "id": student.id,
            "code": student.student_code,
            "document_id": student.document_id,
            "full_name": user.full_name,
            "email": user.email,
            "program": program.name,
            "faculty": program.faculty,
            "current_semester": student.current_semester,
            "academic_standing": "Matrícula de Honor" if cumulative_gpa >= 4.5 else ("Regular" if cumulative_gpa >= 3.0 else "Condicional"),
        },
        "academic_summary": {
            "total_credits_evaluated": total_credits,
            "cumulative_gpa": cumulative_gpa,
            "subjects_count": len(subjects_history),
        },
        "subjects": subjects_history
    }
