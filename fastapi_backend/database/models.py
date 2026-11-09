from datetime import datetime
import enum
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, 
    Text, Enum, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    COORDINATOR = "Coordinador"
    TEACHER = "Docente"
    STUDENT = "Estudiante"

class EnrollmentStatus(str, enum.Enum):
    ACTIVE = "Activa"
    COMPLETED = "Completada"
    DROPPED = "Cancelada"

class PeriodStatus(str, enum.Enum):
    PLANNING = "Planificación"
    ACTIVE = "Activo"
    CLOSED = "Cerrado"

# RF-01 & RF-02: Usuarios y Roles
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student_profile = relationship("Student", back_populates="user", uselist=False)
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)

# RF-05: Programas Académicos
class Program(Base):
    __tablename__ = "programs"

    id = Column(String(36), primary_key=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    faculty = Column(String(255), nullable=False)
    total_credits = Column(Integer, nullable=False)
    duration_semesters = Column(Integer, nullable=False)
    degree_title = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    subjects = relationship("Subject", back_populates="program")
    students = relationship("Student", back_populates="program")

# RF-03: Estudiantes (CRUD)
class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_code = Column(String(50), unique=True, nullable=False, index=True)
    program_id = Column(String(36), ForeignKey("programs.id"), nullable=False)
    current_semester = Column(Integer, default=1, nullable=False)
    gpa = Column(Float, default=0.0, nullable=False)
    status = Column(String(50), default="Regular", nullable=False) # Regular, Condicional, Egresado
    phone = Column(String(30), nullable=True)
    document_id = Column(String(50), unique=True, nullable=False)

    user = relationship("User", back_populates="student_profile")
    program = relationship("Program", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student")

# RF-04: Docentes (CRUD)
class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_code = Column(String(50), unique=True, nullable=False, index=True)
    department = Column(String(255), nullable=False)
    specialty = Column(String(255), nullable=False)
    academic_degree = Column(String(100), nullable=False) # Maestría, Doctorado, Especialización
    contract_type = Column(String(50), default="Tiempo Completo", nullable=False)

    user = relationship("User", back_populates="teacher_profile")
    schedules = relationship("Schedule", back_populates="teacher")

# RF-05: Asignaturas
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    program_id = Column(String(36), ForeignKey("programs.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    credits = Column(Integer, nullable=False)
    prerequisite_code = Column(String(20), nullable=True) # Código de prerrequisito

    program = relationship("Program", back_populates="subjects")
    schedules = relationship("Schedule", back_populates="subject")

# RF-06: Periodos Lectivos
class AcademicPeriod(Base):
    __tablename__ = "academic_periods"

    id = Column(String(36), primary_key=True)
    code = Column(String(20), unique=True, nullable=False, index=True) # e.g. 2026-1
    name = Column(String(100), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(Enum(PeriodStatus), default=PeriodStatus.PLANNING, nullable=False)

    schedules = relationship("Schedule", back_populates="period")

# RF-06: Horarios y Asignación de Cupos
class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(String(36), primary_key=True)
    period_id = Column(String(36), ForeignKey("academic_periods.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(String(36), ForeignKey("teachers.id"), nullable=False)
    classroom = Column(String(50), nullable=False)
    day_of_week = Column(String(20), nullable=False) # Lunes, Martes, etc.
    start_time = Column(String(10), nullable=False) # 08:00
    end_time = Column(String(10), nullable=False)   # 10:00
    total_quota = Column(Integer, nullable=False, default=30)
    enrolled_count = Column(Integer, nullable=False, default=0)

    # RNF-07: Integridad ACID - Verificación de cupos no negativos y que enrolled_count <= total_quota
    __table_args__ = (
        CheckConstraint("enrolled_count <= total_quota", name="check_quota_not_exceeded"),
        CheckConstraint("enrolled_count >= 0", name="check_enrolled_non_negative"),
    )

    period = relationship("AcademicPeriod", back_populates="schedules")
    subject = relationship("Subject", back_populates="schedules")
    teacher = relationship("Teacher", back_populates="schedules")
    enrollments = relationship("Enrollment", back_populates="schedule")

# RF-07: Matrícula de Asignaturas con verificación de cupos
class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(String(36), primary_key=True)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    schedule_id = Column(String(36), ForeignKey("schedules.id"), nullable=False)
    enrollment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE, nullable=False)

    # Evitar doble matrícula en el mismo horario para el mismo estudiante
    __table_args__ = (
        UniqueConstraint("student_id", "schedule_id", name="uq_student_schedule"),
    )

    student = relationship("Student", back_populates="enrollments")
    schedule = relationship("Schedule", back_populates="enrollments")
    grades = relationship("Grade", back_populates="enrollment", uselist=False)

# RF-08: Registro de Calificaciones (notas de 0.0 a 5.0)
class Grade(Base):
    __tablename__ = "grades"

    id = Column(String(36), primary_key=True)
    enrollment_id = Column(String(36), ForeignKey("enrollments.id"), unique=True, nullable=False)
    teacher_id = Column(String(36), ForeignKey("teachers.id"), nullable=False)
    
    # Cortes evaluativos: Corte 1 (30%), Corte 2 (30%), Corte 3 (40%)
    corte_1 = Column(Float, nullable=True)
    corte_2 = Column(Float, nullable=True)
    corte_3 = Column(Float, nullable=True)
    final_grade = Column(Float, nullable=True)
    approved = Column(Boolean, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # RNF-07: Restricción Check: notas en rango 0.0 a 5.0
    __table_args__ = (
        CheckConstraint("corte_1 >= 0.0 AND corte_1 <= 5.0", name="chk_corte_1_range"),
        CheckConstraint("corte_2 >= 0.0 AND corte_2 <= 5.0", name="chk_corte_2_range"),
        CheckConstraint("corte_3 >= 0.0 AND corte_3 <= 5.0", name="chk_corte_3_range"),
        CheckConstraint("final_grade >= 0.0 AND final_grade <= 5.0", name="chk_final_grade_range"),
    )

    enrollment = relationship("Enrollment", back_populates="grades")

# RF-12 & RNF-10: Bitácora de Auditoría Desacoplada (Inmutable)
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    actor_id = Column(String(36), nullable=False)
    actor_email = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False) # CREATE, UPDATE, DELETE, ENROLL, GRADE_MUTATION, LOGIN
    entity = Column(String(100), nullable=False) # Student, Teacher, Grade, Enrollment, Subject
    entity_id = Column(String(36), nullable=False)
    before_state = Column(Text, nullable=True) # JSON serializado
    after_state = Column(Text, nullable=True)  # JSON serializado
    ip_address = Column(String(45), nullable=True)
    integrity_hash = Column(String(64), nullable=False) # SHA-256 inmutabilidad

# RF-11: Sistema de Notificaciones de eventos clave
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO", nullable=False) # INFO, SUCCESS, WARNING, GRADE, ENROLLMENT
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
