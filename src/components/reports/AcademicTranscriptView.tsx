import React, { useState, useEffect } from 'react';
import { StudentTranscript, Student } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Printer,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

interface AcademicTranscriptViewProps {
  initialStudentId?: string;
}

export const AcademicTranscriptView: React.FC<AcademicTranscriptViewProps> = ({ initialStudentId }) => {
  const { user, role } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [transcript, setTranscript] = useState<StudentTranscript | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stuList = await api.getStudents();
        setStudents(stuList);

        if (initialStudentId) {
          setSelectedStudentId(initialStudentId);
        } else if (role === 'Estudiante') {
          const self = stuList.find((s) => s.userId === user?.id);
          setSelectedStudentId(self ? self.id : stuList[0]?.id || '');
        } else if (stuList.length > 0) {
          setSelectedStudentId(stuList[0].id);
        }
      } catch (e) {
        console.error('Error loading students:', e);
      }
    };
    init();
  }, [role, user, initialStudentId]);

  const loadTranscript = async (stuId: string) => {
    if (!stuId) return;
    setLoading(true);
    setAiInsight(null);
    try {
      const data = await api.getTranscript(stuId);
      setTranscript(data);
    } catch (e) {
      console.error('Error loading transcript:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadTranscript(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleGenerateAiInsight = async () => {
    if (!transcript) return;
    setGeneratingAi(true);
    try {
      const res = await api.generateBulletinInsight({
        studentName: transcript.student.fullName,
        programName: transcript.student.programName,
        gpa: transcript.summary.cumulativeGpa,
        gradesSummary: transcript.subjects.map((s) => ({
          subjectName: s.subjectName,
          corte1: s.corte1,
          corte2: s.corte2,
          corte3: s.corte3,
          finalGrade: s.finalGrade,
          approved: s.approved,
        })),
      });
      setAiInsight(res.insight);
    } catch (err: any) {
      alert(`Error con Google AI Studio: ${err.message}`);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Boletín Oficial e Historial Académico (RF-09 & RF-10)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Certificado oficial de calificaciones, promedio ponderado acumulado (PPA) y evaluación pedagógica formativa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role !== 'Estudiante' && (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Exportar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-slate-850 rounded-2xl border border-slate-800">
          Cargando certificado académico...
        </div>
      ) : !transcript ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-slate-850 rounded-2xl border border-slate-800">
          No se encontró información académica para este estudiante.
        </div>
      ) : (
        /* Printable Academic Certificate */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Institutional Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 print:border-black/20 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg print:bg-black">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight uppercase print:text-black">
                  {transcript.institution}
                </h2>
                <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider print:text-gray-700">
                  Secretaría General • Registro & Control Académico
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5 print:text-gray-500">
                  Documento Oficial de Certificación de Calificaciones
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-xs space-y-1">
              <div className="text-slate-400 print:text-gray-600">Fecha de Emisión: {new Date().toLocaleDateString()}</div>
              <div className="text-[10px] text-cyan-400 truncate max-w-xs print:text-gray-500">
                Hash: {transcript.verificationHash.slice(0, 16)}...
              </div>
            </div>
          </div>

          {/* Student Profile Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-850 border border-slate-800 text-xs print:bg-gray-50 print:border-gray-200">
            <div>
              <span className="text-slate-400 print:text-gray-500">Estudiante</span>
              <div className="font-bold text-white text-sm mt-0.5 print:text-black">{transcript.student.fullName}</div>
              <div className="text-[11px] text-slate-500 print:text-gray-600">CC: {transcript.student.documentId}</div>
            </div>

            <div>
              <span className="text-slate-400 print:text-gray-500">Código Universitario</span>
              <div className="font-bold text-indigo-400 font-mono text-sm mt-0.5 print:text-black">
                {transcript.student.code}
              </div>
              <div className="text-[11px] text-slate-500 print:text-gray-600">Nivel: Semestre {transcript.student.currentSemester}</div>
            </div>

            <div>
              <span className="text-slate-400 print:text-gray-500">Programa Académico</span>
              <div className="font-bold text-white mt-0.5 print:text-black">{transcript.student.programName}</div>
              <div className="text-[11px] text-slate-500 print:text-gray-600">{transcript.student.faculty}</div>
            </div>

            <div>
              <span className="text-slate-400 print:text-gray-500">Condición Académica</span>
              <div className="mt-0.5">
                <span
                  className={`px-2.5 py-0.5 rounded font-bold text-xs inline-block ${
                    transcript.summary.cumulativeGpa >= 4.5
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : transcript.summary.cumulativeGpa >= 3.0
                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {transcript.student.academicStanding}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                GPA: {transcript.summary.cumulativeGpa.toFixed(2)} / 5.0
              </div>
            </div>
          </div>

          {/* Subjects and Grades Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black">
              Detalle de Asignaturas Cursadas y Evaluaciones
            </h3>

            <div className="rounded-xl border border-slate-800 overflow-hidden print:border-gray-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850 text-slate-300 font-bold border-b border-slate-800 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Asignatura</th>
                    <th className="py-3 px-4 text-center">Créditos</th>
                    <th className="py-3 px-4 text-center">Corte 1 (30%)</th>
                    <th className="py-3 px-4 text-center">Corte 2 (30%)</th>
                    <th className="py-3 px-4 text-center">Corte 3 (40%)</th>
                    <th className="py-3 px-4 text-center">Definitiva</th>
                    <th className="py-3 px-4 text-center">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                  {transcript.subjects.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400 print:text-black">
                        {sub.subjectCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white print:text-black">{sub.subjectName}</div>
                        <div className="text-[11px] text-slate-500 print:text-gray-500">{sub.teacherName}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{sub.credits}</td>
                      <td className="py-3 px-4 text-center font-mono">{sub.corte1 !== null ? sub.corte1.toFixed(1) : '—'}</td>
                      <td className="py-3 px-4 text-center font-mono">{sub.corte2 !== null ? sub.corte2.toFixed(1) : '—'}</td>
                      <td className="py-3 px-4 text-center font-mono">{sub.corte3 !== null ? sub.corte3.toFixed(1) : '—'}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white print:text-black">
                        {sub.finalGrade !== null ? sub.finalGrade.toFixed(2) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sub.finalGrade === null ? (
                          <span className="text-slate-500 text-[11px]">En Curso</span>
                        ) : sub.approved ? (
                          <span className="text-emerald-400 font-bold text-[11px] print:text-emerald-700">APROBADO</span>
                        ) : (
                          <span className="text-rose-400 font-bold text-[11px] print:text-rose-700">REPROBADO</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic Standing Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-850 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:border-gray-200 print:bg-gray-50">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">Resumen Estadístico</span>
              <div className="text-sm text-slate-200">
                Créditos Evaluados: <strong className="text-white">{transcript.summary.totalCredits}</strong> • Materias
                Aprobadas: <strong className="text-emerald-400">{transcript.summary.approvedSubjectsCount}</strong> /{' '}
                {transcript.summary.enrolledSubjectsCount}
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Promedio Ponderado Acumulado (PPA)</span>
              <span className="text-3xl font-black text-cyan-400 font-mono print:text-black">
                {transcript.summary.cumulativeGpa.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-mono ml-1">/ 5.00</span>
            </div>
          </div>

          {/* AI Pedagogical Synthesis Section */}
          <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-3 print:border-gray-300 print:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Síntesis Pedagógica Formativa (Google AI Studio - Gemini 3.8 Flash)</span>
              </div>
              <button
                onClick={handleGenerateAiInsight}
                disabled={generatingAi}
                className="print:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {generatingAi ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analizando historial con Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiInsight ? 'Regenerar Evaluación AI' : 'Generar Síntesis AI'}</span>
                  </>
                )}
              </button>
            </div>

            {aiInsight ? (
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-indigo-900/50 print:bg-white print:text-black print:border-gray-200">
                {aiInsight}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Haz clic en el botón superior para que Google AI Studio genere el análisis cualitativo y recomendaciones
                formativas personalizadas para este estudiante.
              </p>
            )}
          </div>

          {/* Official Signatures & Verification Seal */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 print:border-gray-300 text-xs">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center p-2 text-slate-400 print:bg-white print:border-gray-300">
                <QrCode className="w-full h-full text-indigo-400 print:text-black" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5 print:text-black">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sello Digital de Autenticidad</span>
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs print:text-gray-600">
                  Certificado emitido electrónicamente según los decretos universitarios de integridad académica.
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <div className="w-48 border-b border-slate-600 mx-auto sm:ml-auto mb-2 print:border-black" />
              <div className="font-bold text-white print:text-black">Dra. María Mercedes Peña</div>
              <div className="text-[11px] text-slate-400 print:text-gray-600">Dirección de Registro y Control Académico</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
