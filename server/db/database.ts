import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'Admin' | 'Coordinador' | 'Docente' | 'Estudiante';
  isActive: boolean;
  avatarUrl?: string;
}

export interface Student {
  id: string;
  userId: string;
  studentCode: string;
  documentId: string;
  programId: string;
  currentSemester: number;
  gpa: number;
  status: 'Regular' | 'Condicional' | 'Graduado';
  phone: string;
}

export interface Teacher {
  id: string;
  userId: string;
  employeeCode: string;
  department: string;
  specialty: string;
  academicDegree: string;
  contractType: string;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  faculty: string;
  totalCredits: number;
  durationSemesters: number;
  degreeTitle: string;
  isActive: boolean;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  programId: string;
  semester: number;
  credits: number;
  prerequisiteCode?: string;
  description: string;
}

export interface AcademicPeriod {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Planificación' | 'Activo' | 'Cerrado';
}

export interface Schedule {
  id: string;
  periodId: string;
  subjectId: string;
  teacherId: string;
  classroom: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  totalQuota: number;
  enrolledCount: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  scheduleId: string;
  enrollmentDate: string;
  status: 'Activa' | 'Completada' | 'Cancelada';
}

export interface Grade {
  id: string;
  enrollmentId: string;
  teacherId: string;
  corte1: number | null; // 30%
  corte2: number | null; // 30%
  corte3: number | null; // 40%
  finalGrade: number | null;
  approved: boolean | null;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'GRADE' | 'ENROLLMENT';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ENROLL' | 'GRADE_MUTATION' | 'LOGIN' | 'STRESS_TEST';
  entity: string;
  entityId: string;
  beforeState: string | null;
  afterState: string | null;
  ipAddress: string;
  integrityHash: string;
}

export function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// In-Memory Database Engine with ACID and Thread-Safe Mutex Simulation
class DatabaseEngine {
  users: Map<string, User> = new Map();
  students: Map<string, Student> = new Map();
  teachers: Map<string, Teacher> = new Map();
  programs: Map<string, Program> = new Map();
  subjects: Map<string, Subject> = new Map();
  periods: Map<string, AcademicPeriod> = new Map();
  schedules: Map<string, Schedule> = new Map();
  enrollments: Map<string, Enrollment> = new Map();
  grades: Map<string, Grade> = new Map();
  notifications: Notification[] = [];
  auditLogs: AuditLog[] = [];

  // Atomic lock for concurrent enrollment transactions (RNF-03 & RNF-07)
  private enrollmentLock: Promise<void> = Promise.resolve();

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Programas
    const progSistemas: Program = {
      id: 'prog-01',
      code: 'ING-SIS',
      name: 'Ingeniería de Sistemas y Computación',
      faculty: 'Facultad de Ingeniería',
      totalCredits: 160,
      durationSemesters: 10,
      degreeTitle: 'Ingeniero de Sistemas',
      isActive: true,
    };
    const progDerecho: Program = {
      id: 'prog-02',
      code: 'DER-01',
      name: 'Derecho y Ciencias Políticas',
      faculty: 'Facultad de Ciencias Jurídicas',
      totalCredits: 170,
      durationSemesters: 10,
      degreeTitle: 'Abogado',
      isActive: true,
    };
    const progMedicina: Program = {
      id: 'prog-03',
      code: 'MED-01',
      name: 'Medicina Humana',
      faculty: 'Facultad de Ciencias de la Salud',
      totalCredits: 220,
      durationSemesters: 12,
      degreeTitle: 'Médico Cirujano',
      isActive: true,
    };
    [progSistemas, progDerecho, progMedicina].forEach((p) => this.programs.set(p.id, p));

    // 2. Asignaturas
    const subs: Subject[] = [
      {
        id: 'sub-01',
        code: 'SIS-101',
        name: 'Algoritmos y Programación Estructurada',
        programId: 'prog-01',
        semester: 1,
        credits: 3,
        description: 'Fundamentos de algoritmia, estructuras de control y paradigmas de programación.',
      },
      {
        id: 'sub-02',
        code: 'SIS-201',
        name: 'Estructuras de Datos y Algoritmos Avanzados',
        programId: 'prog-01',
        semester: 2,
        credits: 4,
        prerequisiteCode: 'SIS-101',
        description: 'Grafos, árboles autobalanceados, complejidad temporal asintótica O(n) y ordenamiento.',
      },
      {
        id: 'sub-03',
        code: 'SIS-301',
        name: 'Bases de Datos Relacionales y SQL',
        programId: 'prog-01',
        semester: 3,
        credits: 4,
        prerequisiteCode: 'SIS-201',
        description: 'Modelo entidad-relación, normalización BCNF, transacciones ACID y PostgreSQL.',
      },
      {
        id: 'sub-04',
        code: 'SIS-401',
        name: 'Arquitectura de Software y Sistemas Distribuidos',
        programId: 'prog-01',
        semester: 4,
        credits: 3,
        prerequisiteCode: 'SIS-301',
        description: 'Monolitos modulares, microservicios, Event-Driven Architecture y patrones de diseño.',
      },
      {
        id: 'sub-05',
        code: 'SIS-501',
        name: 'Inteligencia Artificial y Modelos Generativos',
        programId: 'prog-01',
        semester: 5,
        credits: 4,
        prerequisiteCode: 'SIS-401',
        description: 'Machine Learning, redes neuronales profundas y la API de Google AI Studio.',
      },
      {
        id: 'sub-06',
        code: 'MAT-101',
        name: 'Cálculo Diferencial e Integral',
        programId: 'prog-01',
        semester: 1,
        credits: 4,
        description: 'Límites, derivadas, integrales de Riemann y aplicaciones en ingeniería.',
      },
      {
        id: 'sub-07',
        code: 'DER-101',
        name: 'Introducción al Derecho Constitucional',
        programId: 'prog-02',
        semester: 1,
        credits: 3,
        description: 'Estructura dogmática y orgánica del estado, derechos fundamentales.',
      },
      {
        id: 'sub-08',
        code: 'MED-101',
        name: 'Anatomía Humana y Fisiología General',
        programId: 'prog-03',
        semester: 1,
        credits: 5,
        description: 'Sistemas esquelético, muscular, cardiovascular y nervioso central.',
      },
    ];
    subs.forEach((s) => this.subjects.set(s.id, s));

    // 3. Usuarios Principales y Perfiles
    const users: User[] = [
      {
        id: 'usr-admin',
        email: 'admin@sga.edu.co',
        passwordHash: 'admin123',
        fullName: 'Ing. Roberto Andrade',
        role: 'Admin',
        isActive: true,
      },
      {
        id: 'usr-coord',
        email: 'coordinador@sga.edu.co',
        passwordHash: 'coord123',
        fullName: 'Dra. María Mercedes Peña',
        role: 'Coordinador',
        isActive: true,
      },
      {
        id: 'usr-doc1',
        email: 'carlos.mendoza@sga.edu.co',
        passwordHash: 'doc123',
        fullName: 'Dr. Carlos Mendoza',
        role: 'Docente',
        isActive: true,
      },
      {
        id: 'usr-doc2',
        email: 'elena.salazar@sga.edu.co',
        passwordHash: 'doc123',
        fullName: 'Msc. Elena Salazar',
        role: 'Docente',
        isActive: true,
      },
      {
        id: 'usr-doc3',
        email: 'andres.morales@sga.edu.co',
        passwordHash: 'doc123',
        fullName: 'Dr. Andrés Morales',
        role: 'Docente',
        isActive: true,
      },
      {
        id: 'usr-stu1',
        email: 'daniel.betancourth@cun.edu.co',
        passwordHash: 'stu123',
        fullName: 'Daniel Betancourth',
        role: 'Estudiante',
        isActive: true,
      },
      {
        id: 'usr-stu2',
        email: 'sofia.arango@sga.edu.co',
        passwordHash: 'stu123',
        fullName: 'Sofía Arango Rúa',
        role: 'Estudiante',
        isActive: true,
      },
      {
        id: 'usr-stu3',
        email: 'camilo.torres@sga.edu.co',
        passwordHash: 'stu123',
        fullName: 'Camilo Torres Gil',
        role: 'Estudiante',
        isActive: true,
      },
      {
        id: 'usr-stu4',
        email: 'mateo.restrepo@sga.edu.co',
        passwordHash: 'stu123',
        fullName: 'Mateo Restrepo Gómez',
        role: 'Estudiante',
        isActive: true,
      },
    ];
    users.forEach((u) => this.users.set(u.id, u));

    // Docentes
    const teachers: Teacher[] = [
      {
        id: 'tch-01',
        userId: 'usr-doc1',
        employeeCode: 'DOC-8820',
        department: 'Ingeniería de Software & Computación',
        specialty: 'Arquitectura de Software y Sistemas Distribuidos',
        academicDegree: 'Doctorado en Ciencias de la Computación (PhD)',
        contractType: 'Tiempo Completo',
      },
      {
        id: 'tch-02',
        userId: 'usr-doc2',
        employeeCode: 'DOC-7411',
        department: 'Ciencias Básicas y Matemáticas',
        specialty: 'Álgebra Lineal y Modelamiento Estocástico',
        academicDegree: 'Maestría en Matemáticas Aplicadas',
        contractType: 'Tiempo Completo',
      },
      {
        id: 'tch-03',
        userId: 'usr-doc3',
        employeeCode: 'DOC-9032',
        department: 'Ciencias Jurídicas',
        specialty: 'Derecho Procesal y Constitucional',
        academicDegree: 'Doctorado en Derecho Público',
        contractType: 'Cátedra',
      },
    ];
    teachers.forEach((t) => this.teachers.set(t.id, t));

    // Estudiantes
    const students: Student[] = [
      {
        id: 'stu-01',
        userId: 'usr-stu1',
        studentCode: 'EST-2024-00142',
        documentId: '1098765432',
        programId: 'prog-01',
        currentSemester: 5,
        gpa: 4.45,
        status: 'Regular',
        phone: '+57 311 456 7890',
      },
      {
        id: 'stu-02',
        userId: 'usr-stu2',
        studentCode: 'EST-2024-00189',
        documentId: '1023456789',
        programId: 'prog-01',
        currentSemester: 3,
        gpa: 3.85,
        status: 'Regular',
        phone: '+57 320 890 1234',
      },
      {
        id: 'stu-03',
        userId: 'usr-stu3',
        studentCode: 'EST-2025-00055',
        documentId: '1088765431',
        programId: 'prog-01',
        currentSemester: 2,
        gpa: 2.70,
        status: 'Condicional',
        phone: '+57 315 222 3344',
      },
      {
        id: 'stu-04',
        userId: 'usr-stu4',
        studentCode: 'EST-2023-00912',
        documentId: '1011223344',
        programId: 'prog-03',
        currentSemester: 4,
        gpa: 4.75,
        status: 'Regular',
        phone: '+57 300 777 8899',
      },
    ];
    students.forEach((s) => this.students.set(s.id, s));

    // 4. Periodos Lectivos
    const period: AcademicPeriod = {
      id: 'per-2026-1',
      code: '2026-1',
      name: 'Primer Periodo Académico 2026',
      startDate: '2026-02-02T00:00:00Z',
      endDate: '2026-06-20T00:00:00Z',
      status: 'Activo',
    };
    this.periods.set(period.id, period);

    // 5. Horarios y Grupos (con cupos)
    const schedules: Schedule[] = [
      {
        id: 'sch-01',
        periodId: 'per-2026-1',
        subjectId: 'sub-04', // Arquitectura de Software
        teacherId: 'tch-01', // Dr. Carlos Mendoza
        classroom: 'Laboratorio de Computación 402',
        dayOfWeek: 'Lunes y Miércoles',
        startTime: '08:00',
        endTime: '10:00',
        totalQuota: 30,
        enrolledCount: 28, // 2 available seats for live concurrency test!
      },
      {
        id: 'sch-02',
        periodId: 'per-2026-1',
        subjectId: 'sub-05', // Inteligencia Artificial
        teacherId: 'tch-01', // Dr. Carlos Mendoza
        classroom: 'Aula Magna 105',
        dayOfWeek: 'Martes y Jueves',
        startTime: '10:00',
        endTime: '12:00',
        totalQuota: 25,
        enrolledCount: 22,
      },
      {
        id: 'sch-03',
        periodId: 'per-2026-1',
        subjectId: 'sub-03', // Bases de Datos Relacionales
        teacherId: 'tch-01',
        classroom: 'Lab Sistemas 201',
        dayOfWeek: 'Viernes',
        startTime: '14:00',
        endTime: '18:00',
        totalQuota: 30,
        enrolledCount: 29, // 1 cupo disponible!
      },
      {
        id: 'sch-04',
        periodId: 'per-2026-1',
        subjectId: 'sub-06', // Cálculo Diferencial
        teacherId: 'tch-02', // Msc. Elena Salazar
        classroom: 'Edificio B - Aula 301',
        dayOfWeek: 'Lunes y Miércoles',
        startTime: '14:00',
        endTime: '16:00',
        totalQuota: 35,
        enrolledCount: 31,
      },
      {
        id: 'sch-05',
        periodId: 'per-2026-1',
        subjectId: 'sub-07', // Derecho Constitucional
        teacherId: 'tch-03', // Dr. Andrés Morales
        classroom: 'Auditorio Jurídico',
        dayOfWeek: 'Jueves',
        startTime: '16:00',
        endTime: '19:00',
        totalQuota: 40,
        enrolledCount: 38,
      },
    ];
    schedules.forEach((sc) => this.schedules.set(sc.id, sc));

    // 6. Matrículas y Calificaciones previas
    const enr1: Enrollment = {
      id: 'enr-01',
      studentId: 'stu-01',
      scheduleId: 'sch-01', // Arquitectura de Software
      enrollmentDate: '2026-02-03T10:15:00Z',
      status: 'Activa',
    };
    const enr2: Enrollment = {
      id: 'enr-02',
      studentId: 'stu-01',
      scheduleId: 'sch-02', // Inteligencia Artificial
      enrollmentDate: '2026-02-03T10:17:00Z',
      status: 'Activa',
    };
    const enr3: Enrollment = {
      id: 'enr-03',
      studentId: 'stu-02',
      scheduleId: 'sch-01',
      enrollmentDate: '2026-02-03T11:00:00Z',
      status: 'Activa',
    };
    const enr4: Enrollment = {
      id: 'enr-04',
      studentId: 'stu-03', // Estudiante en riesgo
      scheduleId: 'sch-01',
      enrollmentDate: '2026-02-03T11:30:00Z',
      status: 'Activa',
    };
    [enr1, enr2, enr3, enr4].forEach((e) => this.enrollments.set(e.id, e));

    // Calificaciones (RF-08: notas de 0.0 a 5.0)
    // Formula: C1(30%) + C2(30%) + C3(40%)
    const gr1: Grade = {
      id: 'grd-01',
      enrollmentId: 'enr-01',
      teacherId: 'tch-01',
      corte1: 4.5,
      corte2: 4.8,
      corte3: 4.2,
      finalGrade: 4.47,
      approved: true,
      updatedAt: '2026-04-10T14:30:00Z',
    };
    const gr2: Grade = {
      id: 'grd-02',
      enrollmentId: 'enr-02',
      teacherId: 'tch-01',
      corte1: 4.7,
      corte2: 4.6,
      corte3: 4.9,
      finalGrade: 4.75,
      approved: true,
      updatedAt: '2026-04-10T14:35:00Z',
    };
    const gr3: Grade = {
      id: 'grd-03',
      enrollmentId: 'enr-03',
      teacherId: 'tch-01',
      corte1: 3.8,
      corte2: 3.9,
      corte3: 4.0,
      finalGrade: 3.91,
      approved: true,
      updatedAt: '2026-04-11T09:00:00Z',
    };
    const gr4: Grade = {
      id: 'grd-04',
      enrollmentId: 'enr-04', // Camilo Torres (Alerta Temprana)
      teacherId: 'tch-01',
      corte1: 2.4,
      corte2: 2.8,
      corte3: 2.9,
      finalGrade: 2.72,
      approved: false,
      updatedAt: '2026-04-11T09:05:00Z',
    };
    [gr1, gr2, gr3, gr4].forEach((g) => this.grades.set(g.id, g));

    // 7. Notificaciones iniciales
    this.notifications.push(
      {
        id: 'notif-01',
        userId: 'usr-stu1',
        title: 'Matrícula Académica Confirmada',
        message: 'Tu inscripción para el periodo 2026-1 ha sido validada y confirmada en el sistema.',
        type: 'SUCCESS',
        isRead: false,
        createdAt: '2026-02-03T10:18:00Z',
      },
      {
        id: 'notif-02',
        userId: 'usr-stu1',
        title: 'Calificación Publicada: Corte 3',
        message: 'El docente Dr. Carlos Mendoza ha cargado las notas definitivas de Arquitectura de Software.',
        type: 'GRADE',
        isRead: false,
        createdAt: '2026-04-10T14:36:00Z',
      },
      {
        id: 'notif-03',
        userId: 'usr-stu3',
        title: 'Alerta de Rendimiento Académico',
        message: 'Tu promedio ponderado del corte actual está por debajo de 3.0. Te invitamos a solicitar tutoría académica.',
        type: 'WARNING',
        isRead: false,
        createdAt: '2026-04-11T09:10:00Z',
      }
    );

    // 8. Bitácora de Auditoría Inicial (Inmutable)
    const initialLogs: Omit<AuditLog, 'integrityHash'>[] = [
      {
        id: 'aud-01',
        timestamp: '2026-02-01T08:00:00Z',
        actorId: 'usr-admin',
        actorEmail: 'admin@sga.edu.co',
        actorRole: 'Admin',
        action: 'CREATE',
        entity: 'AcademicPeriod',
        entityId: 'per-2026-1',
        beforeState: null,
        afterState: JSON.stringify({ code: '2026-1', status: 'Activo' }),
        ipAddress: '192.168.1.10',
      },
      {
        id: 'aud-02',
        timestamp: '2026-02-03T10:15:00Z',
        actorId: 'usr-stu1',
        actorEmail: 'daniel.betancourth@cun.edu.co',
        actorRole: 'Estudiante',
        action: 'ENROLL',
        entity: 'Enrollment',
        entityId: 'enr-01',
        beforeState: JSON.stringify({ scheduleId: 'sch-01', enrolledCount: 27 }),
        afterState: JSON.stringify({ scheduleId: 'sch-01', enrolledCount: 28, studentId: 'stu-01' }),
        ipAddress: '181.130.45.12',
      },
      {
        id: 'aud-03',
        timestamp: '2026-04-10T14:30:00Z',
        actorId: 'usr-doc1',
        actorEmail: 'carlos.mendoza@sga.edu.co',
        actorRole: 'Docente',
        action: 'GRADE_MUTATION',
        entity: 'Grade',
        entityId: 'grd-01',
        beforeState: JSON.stringify({ corte1: 4.5, corte2: 4.8, corte3: null }),
        afterState: JSON.stringify({ corte1: 4.5, corte2: 4.8, corte3: 4.2, finalGrade: 4.47, approved: true }),
        ipAddress: '190.158.20.5',
      },
    ];

    initialLogs.forEach((l) => {
      const raw = `${l.actorId}:${l.action}:${l.entityId}:${l.timestamp}:${l.afterState}`;
      const integrityHash = hashString(raw);
      this.auditLogs.push({ ...l, integrityHash });
    });
  }

  // Atomic ACID Transaction for Enrollment with Quota Lock (RNF-03, RNF-07)
  async executeAtomicEnrollment(
    studentId: string,
    scheduleId: string,
    actor: { id: string; email: string; role: string; ip: string }
  ): Promise<{ success: boolean; enrollment?: Enrollment; error?: string }> {
    // Acquire mutex lock sequentially
    const unlock = await this.acquireEnrollmentLock();
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        return { success: false, error: 'Grupo/Horario no encontrado.' };
      }

      const student = this.students.get(studentId);
      if (!student) {
        return { success: false, error: 'Estudiante no registrado.' };
      }

      // 1. Quota check (ACID invariant)
      if (schedule.enrolledCount >= schedule.totalQuota) {
        return {
          success: false,
          error: `Cupos agotados (${schedule.enrolledCount}/${schedule.totalQuota}). No se permite sobrecupo.`,
        };
      }

      // 2. Duplicate enrollment check
      const existing = Array.from(this.enrollments.values()).find(
        (e) => e.studentId === studentId && e.scheduleId === scheduleId && e.status === 'Activa'
      );
      if (existing) {
        return { success: false, error: 'El estudiante ya está matriculado en esta asignatura.' };
      }

      // 3. Atomic Mutation
      const prevEnrolled = schedule.enrolledCount;
      schedule.enrolledCount += 1;

      const newEnrollment: Enrollment = {
        id: `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        studentId,
        scheduleId,
        enrollmentDate: new Date().toISOString(),
        status: 'Activa',
      };
      this.enrollments.set(newEnrollment.id, newEnrollment);

      // Notification
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: student.userId,
        title: 'Matrícula Exitosa',
        message: `Asignatura inscrita correctamente en el grupo ${schedule.classroom}.`,
        type: 'ENROLLMENT',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Audit Log dispatch
      this.recordAudit({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'ENROLL',
        entity: 'Enrollment',
        entityId: newEnrollment.id,
        beforeState: JSON.stringify({ scheduleId, enrolledCount: prevEnrolled }),
        afterState: JSON.stringify({ scheduleId, enrolledCount: schedule.enrolledCount, studentId }),
        ipAddress: actor.ip,
      });

      return { success: true, enrollment: newEnrollment };
    } finally {
      unlock();
    }
  }

  // Mutex lock helper
  private async acquireEnrollmentLock(): Promise<() => void> {
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const currentLock = this.enrollmentLock;
    this.enrollmentLock = this.enrollmentLock.then(() => nextLock);
    await currentLock;
    return releaseLock!;
  }

  recordAudit(data: Omit<AuditLog, 'id' | 'timestamp' | 'integrityHash'>) {
    const timestamp = new Date().toISOString();
    const id = `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const raw = `${data.actorId}:${data.action}:${data.entityId}:${timestamp}:${data.afterState}`;
    const integrityHash = hashString(raw);

    const log: AuditLog = {
      id,
      timestamp,
      actorId: data.actorId,
      actorEmail: data.actorEmail,
      actorRole: data.actorRole,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      beforeState: data.beforeState,
      afterState: data.afterState,
      ipAddress: data.ipAddress,
      integrityHash,
    };
    this.auditLogs.unshift(log);
    return log;
  }
}

export const db = new DatabaseEngine();
