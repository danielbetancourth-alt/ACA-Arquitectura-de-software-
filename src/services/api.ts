import {
  User,
  Student,
  Teacher,
  Program,
  Subject,
  AcademicPeriod,
  Schedule,
  GradeItem,
  Notification,
  AuditLog,
  StudentTranscript,
  PythonCodeFile,
  UserRole,
} from '../types';

const TOKEN_KEY = 'sga_jwt_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'Error en la petición al servidor';
      try {
        const data = await response.json();
        errorMsg = data.error || data.message || errorMsg;
      } catch (e) {
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  // Auth (RF-01, RF-02)
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  },

  async switchRole(role: UserRole): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    this.setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User; profile: any }> {
    return this.request<{ user: User; profile: any }>('/api/auth/me');
  },

  // Students (RF-03)
  async getStudents(search?: string, programId?: string): Promise<Student[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (programId) params.append('programId', programId);
    return this.request<Student[]>(`/api/students?${params.toString()}`);
  },

  async createStudent(payload: any): Promise<{ message: string; student: Student }> {
    return this.request<{ message: string; student: Student }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStudent(id: string, payload: any): Promise<{ message: string; student: Student }> {
    return this.request<{ message: string; student: Student }>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Teachers (RF-04)
  async getTeachers(): Promise<Teacher[]> {
    return this.request<Teacher[]>('/api/teachers');
  },

  async createTeacher(payload: any): Promise<{ message: string; teacher: Teacher }> {
    return this.request<{ message: string; teacher: Teacher }>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Academic (RF-05, RF-06)
  async getPrograms(): Promise<Program[]> {
    return this.request<Program[]>('/api/academic/programs');
  },

  async getSubjects(programId?: string): Promise<Subject[]> {
    const url = programId ? `/api/academic/subjects?programId=${programId}` : '/api/academic/subjects';
    return this.request<Subject[]>(url);
  },

  async getPeriods(): Promise<AcademicPeriod[]> {
    return this.request<AcademicPeriod[]>('/api/academic/periods');
  },

  async getSchedules(periodId?: string): Promise<Schedule[]> {
    const url = periodId ? `/api/academic/schedules?periodId=${periodId}` : '/api/academic/schedules';
    return this.request<Schedule[]>(url);
  },

  // Enrollment (RF-07, RNF-03, RNF-07)
  async enrollStudent(studentId: string, scheduleId: string): Promise<any> {
    return this.request('/api/academic/enroll', {
      method: 'POST',
      body: JSON.stringify({ studentId, scheduleId }),
    });
  },

  async testConcurrency(scheduleId: string, concurrentAttempts: number = 20): Promise<any> {
    return this.request('/api/academic/stress-test-concurrency', {
      method: 'POST',
      body: JSON.stringify({ scheduleId, concurrentAttempts }),
    });
  },

  // Grades (RF-08)
  async getGradesBySchedule(scheduleId: string): Promise<GradeItem[]> {
    return this.request<GradeItem[]>(`/api/grades/by-schedule/${scheduleId}`);
  },

  async registerGrade(payload: {
    enrollmentId: string;
    corte1: number | null;
    corte2: number | null;
    corte3: number | null;
  }): Promise<any> {
    return this.request('/api/grades/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Reports (RF-09, RF-10)
  async getTranscript(studentId: string): Promise<StudentTranscript> {
    return this.request<StudentTranscript>(`/api/reports/transcript/${studentId}`);
  },

  // Notifications (RF-11)
  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/api/notifications');
  },

  async markNotificationsRead(): Promise<any> {
    return this.request('/api/notifications/mark-read', { method: 'POST' });
  },

  // Audit Logs (RF-12, RNF-10)
  async getAuditLogs(action?: string, entity?: string, limit: number = 100): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    if (entity) params.append('entity', entity);
    params.append('limit', limit.toString());
    return this.request<AuditLog[]>(`/api/audit/logs?${params.toString()}`);
  },

  // Google AI Studio (Gemini 3.8 Flash)
  async generateBulletinInsight(payload: {
    studentName: string;
    programName: string;
    gpa: number;
    gradesSummary: any[];
  }): Promise<{ insight: string }> {
    return this.request<{ insight: string }>('/api/ai/bulletin-insight', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async generateRiskAnalysis(atRiskStudents: any[]): Promise<{ analysis: string }> {
    return this.request<{ analysis: string }>('/api/ai/risk-analysis', {
      method: 'POST',
      body: JSON.stringify({ atRiskStudents }),
    });
  },

  async generateSyllabus(payload: {
    subjectName: string;
    credits: number;
    semester: number;
    career: string;
  }): Promise<{ syllabus: string; rubrics: Array<{ criteria: string; weight: string; description: string }> }> {
    return this.request<{ syllabus: string; rubrics: any[] }>('/api/ai/syllabus-assistant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Python Code Files Explorer
  async getPythonCodeFiles(): Promise<PythonCodeFile[]> {
    return this.request<PythonCodeFile[]>('/api/code/files');
  },
};
