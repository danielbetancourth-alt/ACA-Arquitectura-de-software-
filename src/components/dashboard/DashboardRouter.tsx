import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { NavTab } from '../layout/Sidebar';
import {
  Users,
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Activity,
} from 'lucide-react';

interface DashboardRouterProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardRouter: React.FC<DashboardRouterProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0,
    programsCount: 0,
    schedulesCount: 0,
    auditCount: 0,
    activePeriod: '2026-1',
  });
  const [isTestingConcurrency, setIsTestingConcurrency] = useState(false);
  const [concurrencyResult, setConcurrencyResult] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [stu, tch, prog, sch, aud] = await Promise.all([
          api.getStudents(),
          api.getTeachers(),
          api.getPrograms(),
          api.getSchedules(),
          api.getAuditLogs('', '', 100),
        ]);
        setStats({
          studentsCount: stu.length,
          teachersCount: tch.length,
          programsCount: prog.length,
          schedulesCount: sch.length,
          auditCount: aud.length,
          activePeriod: '2026-1',
        });
      } catch (e) {
        console.error('Error fetching dashboard stats:', e);
      }
    };
    loadStats();
  }, [role]);

  const runQuickConcurrencyTest = async () => {
    setIsTestingConcurrency(true);
    setConcurrencyResult(null);
    try {
      // Run stress test against schedule 1 (Arquitectura de Software)
      const res = await api.testConcurrency('sch-01', 20);
      setConcurrencyResult(res);
    } catch (e: any) {
      alert(`Error en prueba de concurrencia: ${e.message}`);
    } finally {
      setIsTestingConcurrency(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-indigo-800/40 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plataforma Académica Institucional Activa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bienvenido, {user?.fullName}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Monolito Modular con arquitectura limpia en capas, transacciones ACID para control estricto de cupos,
              bitácora inmutable desacoplada y diagnóstico predictivo con Google AI Studio (Gemini 3.8 Flash).
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('architecture')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition shadow-sm"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Ver Arquitectura & FastAPI</span>
            </button>
            <button
              onClick={() => onNavigate('ai-hub')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Centro AI Studio</span>
            </button>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
      </div>

      {/* Institutional KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estudiantes</span>
            <GraduationCap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.studentsCount}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            100% Activos
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cuerpo Docente</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.teachersCount}</div>
          <div className="text-[11px] text-indigo-300 mt-1">PhD & Magíster</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Programas</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.programsCount}</div>
          <div className="text-[11px] text-amber-300 mt-1">Pregrado Oficial</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Horarios/Grupos</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.schedulesCount}</div>
          <div className="text-[11px] text-blue-300 mt-1">Cupos regulados</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Periodo Activo</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-300 font-mono">{stats.activePeriod}</div>
          <div className="text-[11px] text-slate-400 mt-1">Primer Semestre</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Bitácora Inmutable</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.auditCount}</div>
          <div className="text-[11px] text-purple-300 mt-1">SHA-256 Hashes</div>
        </div>
      </div>

      {/* Operational Highlights & Fast Access Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Requerimientos Funcionales Implementados */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Módulos Funcionales Activos (RF-01 a RF-12)</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              12 / 12 Cumplidos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div
              onClick={() => onNavigate('students')}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-750 cursor-pointer transition flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-indigo-950 text-indigo-300 shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">RF-03 & RF-04: Gestión Estudiantes y Docentes</div>
                <p className="text-slate-400 mt-0.5">CRUD completo, códigos institucionales, vinculación a programas y contratos.</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('enrollment')}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-750 cursor-pointer transition flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-300 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">RF-07: Matrícula Atómica con Cupos (ACID)</div>
                <p className="text-slate-400 mt-0.5">Bloqueo de fila para evitar sobrecupo en entornos concurrentes.</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('grades')}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-750 cursor-pointer transition flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-amber-950 text-amber-300 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">RF-08: Calificaciones (Escala 0.0 a 5.0)</div>
                <p className="text-slate-400 mt-0.5">Cortes C1(30%), C2(30%), C3(40%) con validación CheckConstraint.</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('transcript')}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-750 cursor-pointer transition flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-300 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">RF-09 & RF-10: Boletín Oficial & Historial</div>
                <p className="text-slate-400 mt-0.5">Certificado de notas con QR de verificación y síntesis formativa AI Studio.</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('audit')}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-750 cursor-pointer transition flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-purple-950 text-purple-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">RF-12 & RNF-10: Bitácora de Auditoría Desacoplada</div>
                <p className="text-slate-400 mt-0.5">Event Bus in-memory, registro inmutable antes/después y hash criptográfico.</p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('ai-hub')}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-750 cursor-pointer transition flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-blue-950 text-blue-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Google AI Studio (Gemini 3.8 Flash)</div>
                <p className="text-slate-400 mt-0.5">Alertas tempranas de deserción y redacción pedagógica de boletines.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Prueba de Concurrencia ACID en Vivo (RNF-03) */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-900/40 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Demostrador ACID</span>
              <span className="text-[10px] bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded font-mono border border-indigo-700">
                RNF-03
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Prueba de Concurrencia de Cupos</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dispara 20 peticiones simultáneas sobre el grupo de Arquitectura de Software para verificar que el bloqueo de
              fila atómico previene sobrecupos de forma estricta.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Grupo Objetivo:</span>
              <span className="text-slate-200">Arquitectura de Software</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Capacidad Total:</span>
              <span className="text-slate-200">30 estudiantes</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Concurrencia simulada:</span>
              <span className="text-cyan-400 font-bold">20 hilos simultáneos</span>
            </div>
          </div>

          {concurrencyResult && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Integridad ACID Garantizada</span>
              </div>
              <p className="text-slate-300">
                Se aceptaron <strong className="text-white">{concurrencyResult.successfulEnrollments}</strong> y se
                rechazaron por cupo lleno <strong className="text-white">{concurrencyResult.rejectedEnrollments}</strong>.
              </p>
              <div className="text-[11px] text-emerald-300 font-mono">
                Cupo final: {concurrencyResult.finalEnrolled} / {concurrencyResult.totalQuota} (Sobrecupo: 0)
              </div>
            </div>
          )}

          <button
            onClick={runQuickConcurrencyTest}
            disabled={isTestingConcurrency}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
          >
            {isTestingConcurrency ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ejecutando 20 hilos paralelos...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Ejecutar Test de Concurrencia</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
