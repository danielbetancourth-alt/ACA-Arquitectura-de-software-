import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status
from fastapi_backend.database.models import (
    Student, Schedule, Enrollment, Grade, Subject, AcademicPeriod,
    EnrollmentStatus, Notification
)
from fastapi_backend.audit.event_bus import audit_event_bus, AuditEventPayload

class AcademicService:
    @staticmethod
    async def enroll_student_atomic(
        db: AsyncSession,
        student_id: str,
        schedule_id: str,
        actor_id: str,
        actor_email: str,
        actor_role: str,
        ip_address: str = "127.0.0.1"
    ) -> Enrollment:
        """
        RNF-03 & RNF-07: Concurrencia (hasta 300 usuarios) e Integridad ACID.
        Usa SELECT ... FOR UPDATE en PostgreSQL para bloquear la fila de horario
        y verificar cupos atómicamente evitando condiciones de carrera (Race Conditions).
        """
        # 1. Verificar existencia del estudiante
        student_res = await db.execute(select(Student).where(Student.id == student_id))
        student = student_res.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado en el sistema.")

        # 2. Bloquear la fila de Schedule con FOR UPDATE
        schedule_res = await db.execute(
            select(Schedule).where(Schedule.id == schedule_id).with_for_update()
        )
        schedule = schedule_res.scalar_one_or_none()
        if not schedule:
            raise HTTPException(status_code=404, detail="Horario/Grupo no encontrado.")

        # 3. Validar disponibilidad de cupos
        if schedule.enrolled_count >= schedule.total_quota:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cupos agotados. Capacidad máxima: {schedule.total_quota}, Matriculados: {schedule.enrolled_count}."
            )

        # 4. Validar que el estudiante no esté ya matriculado
        existing_res = await db.execute(
            select(Enrollment).where(
                Enrollment.student_id == student_id,
                Enrollment.schedule_id == schedule_id,
                Enrollment.status == EnrollmentStatus.ACTIVE
            )
        )
        if existing_res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="El estudiante ya está matriculado en este horario.")

        # 5. Crear la matrícula y actualizar contador de cupos atómicamente
        enrollment_id = str(uuid.uuid4())
        new_enrollment = Enrollment(
            id=enrollment_id,
            student_id=student_id,
            schedule_id=schedule_id,
            enrollment_date=datetime.utcnow(),
            status=EnrollmentStatus.ACTIVE
        )
        db.add(new_enrollment)
        
        # Incrementar cupo ocupado
        schedule.enrolled_count += 1
        await db.flush()

        # 6. Notificar al estudiante (RF-11)
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=student.user_id,
            title="Matrícula Exitosa",
            message=f"Se ha formalizado tu inscripción al grupo de la asignatura seleccionada.",
            notification_type="ENROLLMENT"
        )
        db.add(notif)

        # 7. Disparar evento de auditoría desacoplado (RF-12)
        await audit_event_bus.publish(AuditEventPayload(
            actor_id=actor_id,
            actor_email=actor_email,
            actor_role=actor_role,
            action="ENROLL",
            entity="Enrollment",
            entity_id=enrollment_id,
            before_state={"schedule_id": schedule_id, "prev_enrolled": schedule.enrolled_count - 1},
            after_state={"schedule_id": schedule_id, "new_enrolled": schedule.enrolled_count, "student_id": student_id},
            ip_address=ip_address
        ))

        return new_enrollment

    @staticmethod
    async def register_grades(
        db: AsyncSession,
        enrollment_id: str,
        teacher_id: str,
        corte_1: float | None,
        corte_2: float | None,
        corte_3: float | None,
        actor_id: str,
        actor_email: str,
        actor_role: str,
        ip_address: str = "127.0.0.1"
    ) -> Grade:
        """
        RF-08: Registro de Calificaciones (notas de 0.0 a 5.0 por docente).
        Cálculo de ponderación: Corte 1 (30%), Corte 2 (30%), Corte 3 (40%).
        """
        for name, val in [("Corte 1", corte_1), ("Corte 2", corte_2), ("Corte 3", corte_3)]:
            if val is not None and (val < 0.0 or val > 5.0):
                raise HTTPException(
                    status_code=400,
                    detail=f"La nota de {name} ({val}) debe estar en el rango de 0.0 a 5.0."
                )

        # Buscar registro existente o crear uno nuevo
        grade_res = await db.execute(select(Grade).where(Grade.enrollment_id == enrollment_id))
        grade = grade_res.scalar_one_or_none()
        
        before_state = None
        if grade:
            before_state = {
                "corte_1": grade.corte_1,
                "corte_2": grade.corte_2,
                "corte_3": grade.corte_3,
                "final_grade": grade.final_grade,
            }
        else:
            grade = Grade(
                id=str(uuid.uuid4()),
                enrollment_id=enrollment_id,
                teacher_id=teacher_id
            )
            db.add(grade)

        grade.corte_1 = corte_1
        grade.corte_2 = corte_2
        grade.corte_3 = corte_3

        # Calcular definitiva si todos los cortes están presentes
        if corte_1 is not None and corte_2 is not None and corte_3 is not None:
            grade.final_grade = round(corte_1 * 0.30 + corte_2 * 0.30 + corte_3 * 0.40, 2)
            grade.approved = grade.final_grade >= 3.0
        else:
            grade.final_grade = None
            grade.approved = None

        await db.flush()

        # Notificación al estudiante
        enrollment_res = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
        enr = enrollment_res.scalar_one_or_none()
        if enr and enr.student:
            db.add(Notification(
                id=str(uuid.uuid4()),
                user_id=enr.student.user_id,
                title="Actualización de Calificaciones",
                message=f"Se han registrado o actualizado notas en una de tus asignaturas inscritas.",
                notification_type="GRADE"
            ))

        # Auditoría desacoplada
        await audit_event_bus.publish(AuditEventPayload(
            actor_id=actor_id,
            actor_email=actor_email,
            actor_role=actor_role,
            action="GRADE_MUTATION",
            entity="Grade",
            entity_id=grade.id,
            before_state=before_state,
            after_state={
                "corte_1": grade.corte_1,
                "corte_2": grade.corte_2,
                "corte_3": grade.corte_3,
                "final_grade": grade.final_grade,
                "approved": grade.approved
            },
            ip_address=ip_address
        ))

        return grade
