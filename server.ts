import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { db, User, Student, Teacher, Schedule, hashString } from './server/db/database';
import { auditBus } from './server/audit/auditBus';
import {
  generateStudentBulletinInsight,
  generateAtRiskCohortAnalysis,
  generateSyllabusAssistant,
} from './server/ai/gemini';

const JWT_SECRET = process.env.JWT_SECRET || 'sga-jwt-secret-key-2026-academico';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Helper middleware to extract user from Bearer Token
  const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Default fallback to first active user if not provided for convenience in dev
      const defaultUser = db.users.get('usr-admin')!;
      (req as any).user = defaultUser;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.users.get(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      (req as any).user = user;
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
  };

  // ----------------------------------------------------
  // API: Health Check (RNF-04)
  // ----------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      architecture: 'Monolito Modular en Capas',
      db: 'In-Memory ACID Engine with Thread-Safe Mutex & PostgreSQL DDL Schema',
      geminiIntegration: 'Active (@google/genai)',
      uptime: process.uptime(),
    });
  });

  // ----------------------------------------------------
  // API: RF-01 & RF-02 Autenticación y RBAC
  // ----------------------------------------------------
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    auditBus.dispatch({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      beforeState: null,
      afterState: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  });

  // Fast Role Switcher (para pruebas rápidas de los 4 roles RBAC)
  app.post('/api/auth/switch-role', (req, res) => {
    const { role } = req.body;
    let targetUser: User | undefined;

    if (role === 'Admin') targetUser = db.users.get('usr-admin');
    else if (role === 'Coordinador') targetUser = db.users.get('usr-coord');
    else if (role === 'Docente') targetUser = db.users.get('usr-doc1');
    else if (role === 'Estudiante') targetUser = db.users.get('usr-stu1');

    if (!targetUser) {
      return res.status(404).json({ error: 'Rol no configurado en perfiles demo.' });
    }

    const token = jwt.sign(
      { id: targetUser.id, email: targetUser.email, role: targetUser.role, fullName: targetUser.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    auditBus.dispatch({
      actorId: targetUser.id,
      actorEmail: targetUser.email,
      actorRole: targetUser.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: targetUser.id,
      beforeState: null,
      afterState: { switchedTo: role },
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: targetUser,
    });
  });

  app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = (req as any).user as User;
    let profileData: any = null;

    if (user.role === 'Estudiante') {
      const stu = Array.from(db.students.values()).find((s) => s.userId === user.id);
      if (stu) {
        const prog = db.programs.get(stu.programId);
        profileData = { ...stu, programName: prog?.name };
      }
    } else if (user.role === 'Docente') {
      const tch = Array.from(db.teachers.values()).find((t) => t.userId === user.id);
      if (tch) profileData = tch;
    }

    res.json({ user, profile: profileData });
  });

  // ----------------------------------------------------
  // API: RF-03 Gestión de Estudiantes (CRUD)
  // ----------------------------------------------------
  app.get('/api/students', (req, res) => {
    const { search, programId } = req.query;
    let result = Array.from(db.students.values()).map((s) => {
      const user = db.users.get(s.userId);
      const program = db.programs.get(s.programId);
      return {
        ...s,
        fullName: user?.fullName || 'N/A',
        email: user?.email || 'N/A',
        programName: program?.name || 'N/A',
        faculty: program?.faculty || 'N/A',
      };
    });

    if (programId) {
      result = result.filter((s) => s.programId === programId);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.documentId.includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    res.json(result);
  });

  app.post('/api/students', authenticateToken, (req, res) => {
    const actor = (req as any).user as User;
    const { fullName, email, password, documentId, studentCode, programId, currentSemester, phone } = req.body;

    if (!fullName || !email || !documentId || !studentCode || !programId) {
      return res.status(400).json({ error: 'Campos requeridos faltantes.' });
    }

    // Check unique email
    const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const userId = `usr-stu-${Date.now()}`;
    const studentId = `stu-${Date.now()}`;

    const newUser: User = {
      id: userId,
      email,
      passwordHash: password || 'stu123',
      fullName,
      role: 'Estudiante',
      isActive: true,
    };
    db.users.set(userId, newUser);

    const newStudent: Student = {
      id: studentId,
      userId,
      studentCode,
      documentId,
      programId,
      currentSemester: Number(currentSemester) || 1,
      gpa: 0.0,
      status: 'Regular',
      phone: phone || '',
    };
    db.students.set(studentId, newStudent);

    auditBus.dispatch({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'CREATE',
      entity: 'Student',
      entityId: studentId,
      beforeState: null,
      afterState: { studentCode, fullName, email, programId },
      ipAddress: req.ip,
    });

    res.status(201).json({ message: 'Estudiante creado exitosamente.', student: newStudent });
  });

  app.put('/api/students/:id', authenticateToken, (req, res) => {
    const actor = (req as any).user as User;
    const { id } = req.params;
    const student = db.students.get(id);
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado.' });

    const beforeState = { ...student };
    const { fullName, phone, status, currentSemester, gpa } = req.body;

    if (phone !== undefined) student.phone = phone;
    if (status !== undefined) student.status = status;
    if (currentSemester !== undefined) student.currentSemester = Number(currentSemester);
    if (gpa !== undefined) student.gpa = Number(gpa);

    if (fullName) {
      const user = db.users.get(student.userId);
      if (user) user.fullName = fullName;
    }

    auditBus.dispatch({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'UPDATE',
      entity: 'Student',
      entityId: student.id,
      beforeState,
      afterState: student,
      ipAddress: req.ip,
    });

    res.json({ message: 'Estudiante actualizado exitosamente.', student });
  });

  // ----------------------------------------------------
  // API: RF-04 Gestión de Docentes (CRUD)
  // ----------------------------------------------------
  app.get('/api/teachers', (req, res) => {
    const list = Array.from(db.teachers.values()).map((t) => {
      const user = db.users.get(t.userId);
      return {
        ...t,
        fullName: user?.fullName || 'N/A',
        email: user?.email || 'N/A',
        isActive: user?.isActive ?? true,
      };
    });
    res.json(list);
  });

  app.post('/api/teachers', authenticateToken, (req, res) => {
    const actor = (req as any).user as User;
    const { fullName, email, employeeCode, department, specialty, academicDegree, contractType } = req.body;

    if (!fullName || !email || !employeeCode || !department) {
      return res.status(400).json({ error: 'Campos requeridos faltantes.' });
    }

    const userId = `usr-doc-${Date.now()}`;
    const teacherId = `tch-${Date.now()}`;

    const newUser: User = {
      id: userId,
      email,
      passwordHash: 'doc123',
      fullName,
      role: 'Docente',
      isActive: true,
    };
    db.users.set(userId, newUser);

    const newTeacher: Teacher = {
      id: teacherId,
      userId,
      employeeCode,
      department,
      specialty: specialty || 'Ciencias Computacionales',
      academicDegree: academicDegree || 'Maestría',
      contractType: contractType || 'Tiempo Completo',
    };
    db.teachers.set(teacherId, newTeacher);

    auditBus.dispatch({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'CREATE',
      entity: 'Teacher',
      entityId: teacherId,
      beforeState: null,
      afterState: { employeeCode, fullName, email, department },
      ipAddress: req.ip,
    });

    res.status(201).json({ message: 'Docente registrado exitosamente.', teacher: newTeacher });
  });

  // ----------------------------------------------------
  // API: RF-05, RF-06 Programas, Asignaturas, Periodos, Horarios
  // ----------------------------------------------------
  app.get('/api/academic/programs', (req, res) => {
    res.json(Array.from(db.programs.values()));
  });

  app.get('/api/academic/subjects', (req, res) => {
    const { programId } = req.query;
    let subs = Array.from(db.subjects.values());
    if (programId) {
      subs = subs.filter((s) => s.programId === programId);
    }
    res.json(subs);
  });

  app.get('/api/academic/periods', (req, res) => {
    res.json(Array.from(db.periods.values()));
  });

  app.get('/api/academic/schedules', (req, res) => {
    const { periodId } = req.query;
    let list = Array.from(db.schedules.values()).map((sc) => {
      const subject = db.subjects.get(sc.subjectId);
      const teacher = db.teachers.get(sc.teacherId);
      const teacherUser = teacher ? db.users.get(teacher.userId) : null;
      const availableQuota = sc.totalQuota - sc.enrolledCount;

      return {
        ...sc,
        subjectCode: subject?.code || 'N/A',
        subjectName: subject?.name || 'N/A',
        credits: subject?.credits || 3,
        semester: subject?.semester || 1,
        teacherName: teacherUser?.fullName || 'Por Asignar',
        availableQuota,
        isFull: availableQuota <= 0,
      };
    });

    if (periodId) {
      list = list.filter((s) => s.periodId === periodId);
    }
    res.json(list);
  });

  // ----------------------------------------------------
  // API: RF-07 Matrícula Atómica con Bloqueo de Concurrencia (RNF-03, RNF-07)
  // ----------------------------------------------------
  app.post('/api/academic/enroll', authenticateToken, async (req, res) => {
    const actor = (req as any).user as User;
    const { studentId, scheduleId } = req.body;

    if (!studentId || !scheduleId) {
      return res.status(400).json({ error: 'studentId y scheduleId son requeridos.' });
    }

    const result = await db.executeAtomicEnrollment(studentId, scheduleId, {
      id: actor.id,
      email: actor.email,
      role: actor.role,
      ip: req.ip || '127.0.0.1',
    });

    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }

    res.status(201).json({
      message: '¡Matrícula realizada exitosamente con verificación ACID de cupos!',
      enrollment: result.enrollment,
    });
  });

  // RNF-03: Endpoint Demostrador de Prueba de Concurrencia (Stress Test de hasta 300 usuarios concurrentes)
  app.post('/api/academic/stress-test-concurrency', authenticateToken, async (req, res) => {
    const actor = (req as any).user as User;
    const { scheduleId, concurrentAttempts = 20 } = req.body;

    const schedule = db.schedules.get(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Horario no encontrado.' });
    }

    const initialEnrolled = schedule.enrolledCount;
    const totalQuota = schedule.totalQuota;
    const initialAvailable = totalQuota - initialEnrolled;

    // Disparar solicitudes concurrentes simultáneamente
    const promises: Promise<any>[] = [];
    const results: Array<{ attempt: number; success: boolean; message: string }> = [];

    for (let i = 1; i <= concurrentAttempts; i++) {
      const mockStudentId = `stu-stress-${Date.now()}-${i}`;
      db.students.set(mockStudentId, {
        id: mockStudentId,
        userId: actor.id,
        studentCode: `EST-STRESS-${i}`,
        documentId: `999000${i}`,
        programId: 'prog-01',
        currentSemester: 4,
        gpa: 4.0,
        status: 'Regular',
        phone: '3000000000',
      });
      promises.push(
        db
          .executeAtomicEnrollment(mockStudentId, scheduleId, {
            id: actor.id,
            email: actor.email,
            role: actor.role,
            ip: req.ip || '127.0.0.1',
          })
          .then((res) => {
            results.push({
              attempt: i,
              success: res.success,
              message: res.success ? 'Matriculado con cupo atómico' : res.error || 'Rechazado por cupo',
            });
          })
      );
    }

    await Promise.all(promises);

    const successfulCount = results.filter((r) => r.success).length;
    const rejectedCount = results.filter((r) => !r.success).length;

    auditBus.dispatch({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'STRESS_TEST',
      entity: 'Schedule',
      entityId: scheduleId,
      beforeState: { initialEnrolled, totalQuota, initialAvailable },
      afterState: {
        finalEnrolled: schedule.enrolledCount,
        successfulCount,
        rejectedCount,
        noOverEnrollmentGuaranteed: schedule.enrolledCount <= totalQuota,
      },
      ipAddress: req.ip,
    });

    res.json({
      scheduleId,
      initialEnrolled,
      totalQuota,
      initialAvailable,
      concurrentRequestsSent: concurrentAttempts,
      successfulEnrollments: successfulCount,
      rejectedEnrollments: rejectedCount,
      finalEnrolled: schedule.enrolledCount,
      overEnrollmentOccurred: schedule.enrolledCount > totalQuota,
      acidInvariantPreserved: schedule.enrolledCount <= totalQuota,
      details: results.slice(0, 10),
    });
  });

  // ----------------------------------------------------
  // API: RF-08 & RF-09 Registro de Calificaciones (0.0 a 5.0)
  // ----------------------------------------------------
  app.get('/api/grades/by-schedule/:scheduleId', (req, res) => {
    const { scheduleId } = req.params;
    const enrollments = Array.from(db.enrollments.values()).filter((e) => e.scheduleId === scheduleId);

    const list = enrollments.map((enr) => {
      const student = db.students.get(enr.studentId);
      const user = student ? db.users.get(student.userId) : null;
      const grade = Array.from(db.grades.values()).find((g) => g.enrollmentId === enr.id);

      return {
        enrollmentId: enr.id,
        studentId: enr.studentId,
        studentCode: student?.studentCode || 'N/A',
        studentName: user?.fullName || 'N/A',
        studentEmail: user?.email || 'N/A',
        corte1: grade?.corte1 ?? null,
        corte2: grade?.corte2 ?? null,
        corte3: grade?.corte3 ?? null,
        finalGrade: grade?.finalGrade ?? null,
        approved: grade?.approved ?? null,
        updatedAt: grade?.updatedAt || enr.enrollmentDate,
      };
    });

    res.json(list);
  });

  app.post('/api/grades/register', authenticateToken, (req, res) => {
    const actor = (req as any).user as User;
    const { enrollmentId, corte1, corte2, corte3 } = req.body;

    const enr = db.enrollments.get(enrollmentId);
    if (!enr) return res.status(404).json({ error: 'Matrícula no encontrada.' });

    // Validate 0.0 to 5.0 range
    const validateGrade = (val: any, label: string) => {
      if (val !== null && val !== undefined && val !== '') {
        const num = Number(val);
        if (isNaN(num) || num < 0.0 || num > 5.0) {
          throw new Error(`La nota de ${label} (${val}) debe estar en el rango de 0.0 a 5.0.`);
        }
        return Math.round(num * 100) / 100;
      }
      return null;
    };

    let c1: number | null = null;
    let c2: number | null = null;
    let c3: number | null = null;

    try {
      c1 = validateGrade(corte1, 'Corte 1');
      c2 = validateGrade(corte2, 'Corte 2');
      c3 = validateGrade(corte3, 'Corte 3');
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }

    let existingGrade = Array.from(db.grades.values()).find((g) => g.enrollmentId === enrollmentId);
    const beforeState = existingGrade ? { ...existingGrade } : null;

    if (!existingGrade) {
      existingGrade = {
        id: `grd-${Date.now()}`,
        enrollmentId,
        teacherId: actor.id,
        corte1: c1,
        corte2: c2,
        corte3: c3,
        finalGrade: null,
        approved: null,
        updatedAt: new Date().toISOString(),
      };
      db.grades.set(existingGrade.id, existingGrade);
    } else {
      existingGrade.corte1 = c1;
      existingGrade.corte2 = c2;
      existingGrade.corte3 = c3;
      existingGrade.updatedAt = new Date().toISOString();
    }

    // Calculate final grade: C1(30%) + C2(30%) + C3(40%)
    if (c1 !== null && c2 !== null && c3 !== null) {
      const finalVal = Math.round((c1 * 0.3 + c2 * 0.3 + c3 * 0.4) * 100) / 100;
      existingGrade.finalGrade = finalVal;
      existingGrade.approved = finalVal >= 3.0;
    } else {
      existingGrade.finalGrade = null;
      existingGrade.approved = null;
    }

    // Student notification
    const student = db.students.get(enr.studentId);
    if (student) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: student.userId,
        title: 'Calificación Actualizada',
        message: `Tus notas han sido modificadas por el docente. Definitiva actual: ${
          existingGrade.finalGrade !== null ? existingGrade.finalGrade.toFixed(2) : 'En progreso'
        }`,
        type: 'GRADE',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    auditBus.dispatch({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'GRADE_MUTATION',
      entity: 'Grade',
      entityId: existingGrade.id,
      beforeState,
      afterState: existingGrade,
      ipAddress: req.ip,
    });

    res.json({
      message: 'Calificaciones registradas exitosamente (escala 0.0 a 5.0).',
      grade: existingGrade,
    });
  });

  // ----------------------------------------------------
  // API: RF-09 & RF-10 Historial Académico y Boletín Oficial
  // ----------------------------------------------------
  app.get('/api/reports/transcript/:studentId', (req, res) => {
    const { studentId } = req.params;
    const student = db.students.get(studentId);
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado.' });

    const user = db.users.get(student.userId);
    const program = db.programs.get(student.programId);

    const studentEnrollments = Array.from(db.enrollments.values()).filter((e) => e.studentId === studentId);

    let totalWeightedPoints = 0;
    let totalCredits = 0;

    const subjects = studentEnrollments.map((enr) => {
      const schedule = db.schedules.get(enr.scheduleId);
      const subject = schedule ? db.subjects.get(schedule.subjectId) : null;
      const teacher = schedule ? db.teachers.get(schedule.teacherId) : null;
      const teacherUser = teacher ? db.users.get(teacher.userId) : null;
      const grade = Array.from(db.grades.values()).find((g) => g.enrollmentId === enr.id);

      const credits = subject?.credits || 3;
      const finalGrade = grade?.finalGrade ?? null;
      const approved = grade?.approved ?? null;

      if (finalGrade !== null) {
        totalWeightedPoints += finalGrade * credits;
        totalCredits += credits;
      }

      return {
        enrollmentId: enr.id,
        subjectCode: subject?.code || 'N/A',
        subjectName: subject?.name || 'N/A',
        credits,
        semester: subject?.semester || 1,
        teacherName: teacherUser?.fullName || 'Docente Asignado',
        corte1: grade?.corte1 ?? null,
        corte2: grade?.corte2 ?? null,
        corte3: grade?.corte3 ?? null,
        finalGrade,
        approved,
        status: enr.status,
      };
    });

    const cumulativeGpa = totalCredits > 0 ? Math.round((totalWeightedPoints / totalCredits) * 100) / 100 : student.gpa;

    res.json({
      institution: 'SISTEMA DE GESTIÓN ACADÉMICA (SGA) - CAMPUS UNIVERSITARIO',
      verificationHash: hashString(`${student.id}:${cumulativeGpa}:${Date.now()}`),
      student: {
        id: student.id,
        code: student.studentCode,
        documentId: student.documentId,
        fullName: user?.fullName || 'N/A',
        email: user?.email || 'N/A',
        phone: student.phone,
        programName: program?.name || 'N/A',
        faculty: program?.faculty || 'N/A',
        currentSemester: student.currentSemester,
        academicStanding:
          cumulativeGpa >= 4.5 ? 'Matrícula de Honor' : cumulativeGpa >= 3.0 ? 'Regular' : 'Alerta Condicional',
      },
      summary: {
        totalCredits,
        cumulativeGpa,
        enrolledSubjectsCount: subjects.length,
        approvedSubjectsCount: subjects.filter((s) => s.approved === true).length,
      },
      subjects,
    });
  });

  // ----------------------------------------------------
  // API: RF-11 Notificaciones
  // ----------------------------------------------------
  app.get('/api/notifications', authenticateToken, (req, res) => {
    const user = (req as any).user as User;
    const userNotifs = db.notifications.filter((n) => n.userId === user.id);
    res.json(userNotifs);
  });

  app.post('/api/notifications/mark-read', authenticateToken, (req, res) => {
    const user = (req as any).user as User;
    db.notifications.forEach((n) => {
      if (n.userId === user.id) n.isRead = true;
    });
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // API: RF-12 & RNF-10 Bitácora de Auditoría Desacoplada
  // ----------------------------------------------------
  app.get('/api/audit/logs', authenticateToken, (req, res) => {
    const { action, entity, limit = '100' } = req.query;
    let logs = [...db.auditLogs];

    if (action && typeof action === 'string') {
      logs = logs.filter((l) => l.action === action);
    }
    if (entity && typeof entity === 'string') {
      logs = logs.filter((l) => l.entity === entity);
    }

    res.json(logs.slice(0, Number(limit)));
  });

  // ----------------------------------------------------
  // API: Google AI Studio (Gemini 3.8 Flash)
  // ----------------------------------------------------
  app.post('/api/ai/bulletin-insight', authenticateToken, async (req, res) => {
    const { studentName, programName, gpa, gradesSummary } = req.body;
    try {
      const insight = await generateStudentBulletinInsight(
        studentName || 'Estudiante',
        programName || 'Programa Académico',
        Number(gpa) || 4.0,
        gradesSummary || []
      );
      res.json({ insight });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al contactar Google AI Studio', detail: err.message });
    }
  });

  app.post('/api/ai/risk-analysis', authenticateToken, async (req, res) => {
    const { atRiskStudents } = req.body;
    try {
      const analysis = await generateAtRiskCohortAnalysis(atRiskStudents || []);
      res.json({ analysis });
    } catch (err: any) {
      res.status(500).json({ error: 'Error en análisis de riesgo AI Studio', detail: err.message });
    }
  });

  app.post('/api/ai/syllabus-assistant', authenticateToken, async (req, res) => {
    const { subjectName, credits, semester, career } = req.body;
    try {
      const result = await generateSyllabusAssistant(
        subjectName || 'Bases de Datos',
        credits || 3,
        semester || 3,
        career || 'Ingeniería de Sistemas'
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Error en asistente curricular AI Studio', detail: err.message });
    }
  });

  // ----------------------------------------------------
  // API: Python FastAPI Source Code Explorer & Downloader
  // ----------------------------------------------------
  app.get('/api/code/files', (req, res) => {
    const filesToRead = [
      { name: 'main.py', path: 'fastapi_backend/main.py', category: 'FastAPI Entrypoint' },
      { name: 'config.py', path: 'fastapi_backend/core/config.py', category: 'Core & Config' },
      { name: 'security.py', path: 'fastapi_backend/core/security.py', category: 'RBAC & JWT' },
      { name: 'models.py', path: 'fastapi_backend/database/models.py', category: 'PostgreSQL Models (ACID)' },
      { name: 'session.py', path: 'fastapi_backend/database/session.py', category: 'Async Session & Transactions' },
      { name: 'event_bus.py', path: 'fastapi_backend/audit/event_bus.py', category: 'Módulo de Auditoría Desacoplado' },
      { name: 'academic_service.py', path: 'fastapi_backend/services/academic_service.py', category: 'Lógica de Negocio (Cupos & Notas)' },
      { name: 'ai_service.py', path: 'fastapi_backend/services/ai_service.py', category: 'Google AI Studio Integration' },
      { name: 'academic.py', path: 'fastapi_backend/routers/academic.py', category: 'Matrícula Router' },
      { name: 'grades.py', path: 'fastapi_backend/routers/grades.py', category: 'Calificaciones Router' },
      { name: 'docker-compose.yml', path: 'fastapi_backend/docker-compose.yml', category: 'Despliegue Docker & PostgreSQL' },
      { name: 'requirements.txt', path: 'fastapi_backend/requirements.txt', category: 'Dependencias Python' },
      { name: 'README.md', path: 'fastapi_backend/README.md', category: 'Documentación Arquitectura' },
    ];

    const results = filesToRead.map((f) => {
      const fullPath = path.resolve(process.cwd(), f.path);
      let content = '';
      try {
        content = fs.readFileSync(fullPath, 'utf-8');
      } catch (e) {
        content = `# Archivo ${f.name} disponible en ${f.path}`;
      }
      return {
        name: f.name,
        path: f.path,
        category: f.category,
        content,
      };
    });

    res.json(results);
  });

  // ----------------------------------------------------
  // Vite Integration (Dev Mode Middleware)
  // ----------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Global Exception Handler (RNF-11)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[GLOBAL_ERROR_HANDLER]', err);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: err.message || 'Error inesperado',
      path: req.path,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SGA Servidor Monolito Modular activo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error al inicializar el servidor:', err);
  process.exit(1);
});
