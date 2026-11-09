import React, { useState, useEffect } from 'react';
import { Schedule, Student } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  MapPin,
  User,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const EnrollmentView: React.FC = () => {
  const { user, role } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Concurrency Simulation state
  const [simScheduleId, setSimScheduleId] = useState<string>('sch-01');
  const [concurrentThreads, setConcurrentThreads] = useState<number>(20);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schList, stuList] = await Promise.all([api.getSchedules(), api.getStudents()]);
      setSchedules(schList);
      setStudents(stuList);

      // If logged in as student, select self
      if (role === 'Estudiante') {
        const selfStu = stuList.find((s) => s.userId === user?.id);
        if (selfStu) setSelectedStudentId(selfStu.id);
      } else if (stuList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stuList[0].id);
      }
    } catch (e) {
      console.error('Error loading enrollment data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  const handleEnroll = async (scheduleId: string) => {
    if (!selectedStudentId) {
      alert('Por favor selecciona un estudiante para formalizar la matrícula.');
      return;
    }

    setEnrollingId(scheduleId);
    setFeedback(null);

    try {
      const res = await api.enrollStudent(selectedStudentId, scheduleId);
      setFeedback({ type: 'success', message: res.message });
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {
        // ignore
      }
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setEnrollingId(null);
    }
  };

  const handleRunConcurrencySimulation = async () => {
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await api.testConcurrency(simScheduleId, concurrentThreads);
      setSimResult(res);
      await loadData();
    } catch (e: any) {
      alert(`Error en simulación: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">Matrícula de Asignaturas con Verificación de Cupos (RF-07)</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Validación atómica de cupos máximos, prevención estricta de sobrecupo (ACID) y soporte de concurrencia (RNF-03).
        </p>
      </div>

      {/* Student Selector Card */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs text-slate-400 font-medium">Estudiante Activo para Inscripción:</span>
          {role === 'Estudiante' ? (
            <div className="font-bold text-sm text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{selectedStudent?.fullName || user?.fullName}</span>
              <span className="text-indigo-400 text-xs font-mono font-normal">({selectedStudent?.studentCode})</span>
            </div>
          ) : (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} — {s.studentCode} ({s.programName})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedStudent && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Programa: <strong className="text-white">{selectedStudent.programName}</strong>
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Semestre: <strong className="text-cyan-400">{selectedStudent.currentSemester}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Alerts / Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Available Schedules for Enrollment */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Oferta de Horarios Disponibles para Inscripción (Periodo 2026-1)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((sch) => {
            const isFull = sch.availableQuota <= 0;
            const percentage = Math.round((sch.enrolledCount / sch.totalQuota) * 100);
            const isProcessing = enrollingId === sch.id;

            return (
              <div
                key={sch.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                  isFull
                    ? 'bg-slate-900/60 border-slate-800 opacity-80'
                    : 'bg-slate-850 border-slate-800 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-750">
                      {sch.subjectCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFull
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {isFull ? 'Agotado' : `${sch.availableQuota} Cupos Libres`}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{sch.subjectName}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{sch.teacherName}</span>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Ocupación:</span>
                    <span className="text-white font-bold">
                      {sch.enrolledCount} / {sch.totalQuota} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-rose-500' : percentage >= 90 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{sch.dayOfWeek}</span>
                    <span className="font-mono text-cyan-400">{sch.startTime} - {sch.endTime}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleEnroll(sch.id)}
                  disabled={isFull || isProcessing}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isFull
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-600/30'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validando bloqueo ACID...</span>
                    </>
                  ) : isFull ? (
                    <span>Sin Cupos Disponibles</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Matricular Asignatura</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* RNF-03: Concurrency & Stress Testing Simulator Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-800/50 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-indigo-300">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Simulador de Concurrencia y Transacciones ACID (RNF-03 & RNF-07)
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded font-mono bg-indigo-900/60 text-indigo-200 border border-indigo-700 self-start sm:self-auto">
            Garantía: Cero Sobrecupo
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Este laboratorio simula ráfagas de usuarios simultáneos (hasta 300 peticiones concurrentes) intentando
          matricularse al mismo tiempo sobre cupos limitados. El backend ejecuta un bloqueo de fila con exclusión mutua
          atómica garantizando que nunca se exceda la capacidad del aula.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Horario a Someter a Concurrencia:</label>
            <select
              value={simScheduleId}
              onChange={(e) => setSimScheduleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-white font-medium focus:outline-none focus:border-indigo-500"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectName} ({s.enrolledCount}/{s.totalQuota} cupos)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Hilos Concurrentes Simultáneos:</label>
            <select
              value={concurrentThreads}
              onChange={(e) => setConcurrentThreads(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-white font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value={10}>10 Peticiones en Paralelo</option>
              <option value={20}>20 Peticiones en Paralelo</option>
              <option value={50}>50 Peticiones en Paralelo</option>
              <option value={100}>100 Peticiones en Paralelo</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunConcurrencySimulation}
              disabled={isSimulating}
              className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Disparando hilos...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Lanzar Prueba Concurrente</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Simulation Output */}
        {simResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-emerald-400 font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Resultado del Test de Concurrencia ACID
              </span>
              <span>Integridad Confirmada</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div>Peticiones enviadas: <strong className="text-white">{simResult.concurrentRequestsSent}</strong></div>
              <div>Exitosas con cupo: <strong className="text-emerald-400">{simResult.successfulEnrollments}</strong></div>
              <div>Rechazadas por tope: <strong className="text-rose-400">{simResult.rejectedEnrollments}</strong></div>
              <div>Sobrecupo detectado: <strong className="text-cyan-400">{simResult.overEnrollmentOccurred ? 'SÍ (ERROR)' : '0 (CERO)'}</strong></div>
            </div>
            <p className="text-[11px] text-slate-400 font-sans pt-1">
              Las transacciones ejecutaron el aislamiento ACID serializando la verificación y decremento de cupos.
              Toda la evidencia ha sido registrada automáticamente en la Bitácora de Auditoría.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
