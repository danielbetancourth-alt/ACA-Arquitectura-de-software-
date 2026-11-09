export type UserRole = 'Admin' | 'Coordinador' | 'Docente' | 'Estudiante';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
  avatarUrl?: string;
}

export interface Student {
  id: string;
  userId: string;
  studentCode: string;
  documentId: string;
  programId: string;
  programName?: string;
  faculty?: string;
  fullName?: string;
  email?: string;
  currentSemester: number;
  gpa: number;
  status: 'Regular' | 'Condicional' | 'Graduado';
  phone: string;
}

export interface Teacher {
  id: string;
  userId: string;
  employeeCode: string;
  fullName?: string;
  email?: string;
  department: string;
  specialty: string;
  academicDegree: string;
  contractType: string;
  isActive?: boolean;
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
  subjectCode: string;
  subjectName: string;
  credits: number;
  semester: number;
  teacherId: string;
  teacherName: string;
  classroom: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  totalQuota: number;
  enrolledCount: number;
  availableQuota: number;
  isFull: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  scheduleId: string;
  enrollmentDate: string;
  status: 'Activa' | 'Completada' | 'Cancelada';
}

export interface GradeItem {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  corte1: number | null;
  corte2: number | null;
  corte3: number | null;
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

export interface StudentTranscript {
  institution: string;
  verificationHash: string;
  student: {
    id: string;
    code: string;
    documentId: string;
    fullName: string;
    email: string;
    phone: string;
    programName: string;
    faculty: string;
    currentSemester: number;
    academicStanding: string;
  };
  summary: {
    totalCredits: number;
    cumulativeGpa: number;
    enrolledSubjectsCount: number;
    approvedSubjectsCount: number;
  };
  subjects: Array<{
    enrollmentId: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    semester: number;
    teacherName: string;
    corte1: number | null;
    corte2: number | null;
    corte3: number | null;
    finalGrade: number | null;
    approved: boolean | null;
    status: string;
  }>;
}

export interface PythonCodeFile {
  name: string;
  path: string;
  category: string;
  content: string;
}
