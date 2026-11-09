import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  Sparkles,
  AlertTriangle,
  BookOpen,
  Send,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Users,
  Award,
} from 'lucide-react';

export const AIAcademicHub: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'bulletin' | 'risk' | 'syllabus'>('risk');

  // Tool 1: Bulletin Synthesis State
  const [studentName, setStudentName] = useState('Daniel Betancourth');
  const [programName, setProgramName] = useState('Ingeniería de Sistemas y Computación');
  const [gpa, setGpa] = useState('4.45');
  const [bulletinResult, setBulletinResult] = useState<string | null>(null);
  const [bulletinLoading, setBulletinLoading] = useState(false);

  // Tool 2: Early Warning Risk Analysis State
  const [riskResult, setRiskResult] = useState<string | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  // Tool 3: Syllabus Assistant State
  const [subjectName, setSubjectName] = useState('Arquitectura de Software y Sistemas Distribuidos');
  const [credits, setCredits] = useState(4);
  const [semester, setSemester] = useState(4);
  const [syllabusResult, setSyllabusResult] = useState<any>(null);
  const [syllabusLoading, setSyllabusLoading] = useState(false);

  const handleGenerateBulletin = async () => {
    setBulletinLoading(true);
    setBulletinResult(null);
    try {
      const res = await api.generateBulletinInsight({
        studentName,
        programName,
        gpa: parseFloat(gpa) || 4.0,
        gradesSummary: [
          { subjectName: 'Arquitectura de Software', corte1: 4.5, corte2: 4.8, corte3: 4.2, finalGrade: 4.47, approved: true },
          { subjectName: 'Inteligencia Artificial', corte1: 4.7, corte2: 4.6, corte3: 4.9, finalGrade: 4.75, approved: true },
        ],
      });
      setBulletinResult(res.insight);
    } catch (e: any) {
      alert(`Error AI Studio: ${e.message}`);
    } finally {
      setBulletinLoading(false);
    }
  };

  const handleGenerateRiskAnalysis = async () => {
    setRiskLoading(true);
    setRiskResult(null);
    try {
      const res = await api.generateRiskAnalysis([
        {
          studentCode: 'EST-2025-00055',
          studentName: 'Camilo Torres Gil',
          programName: 'Ingeniería de Sistemas',
          gpa: 2.70,
          failedSubjects: ['Arquitectura de Software (C1: 2.4, C2: 2.8)'],
        },
      ]);
      setRiskResult(res.analysis);
    } catch (e: any) {
      alert(`Error AI Studio: ${e.message}`);
    } finally {
      setRiskLoading(false);
    }
  };

  const handleGenerateSyllabus = async () => {
    setSyllabusLoading(true);
    setSyllabusResult(null);
    try {
      const res = await api.generateSyllabus({
        subjectName,
        credits,
        semester,
        career: 'Ingeniería de Sistemas',
      });
      setSyllabusResult(res);
    } catch (e: any) {
      alert(`Error AI Studio: ${e.message}`);
    } finally {
      setSyllabusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Google AI Studio • Modelo Gemini 3.8 Flash</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Centro de Inteligencia Académica Institucional</h1>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Módulo de asistencia pedagógica impulsado por el SDK oficial de Google GenAI en el backend. Diagnóstico de
          rendimiento, alertas tempranas de deserción estudiantil y asistencia en diseño curricular.
        </p>

        {/* Sub-Tabs */}
        <div className="pt-3 flex gap-2">
          <button
            onClick={() => setActiveTool('risk')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'risk'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Alertas Tempranas & Riesgo
          </button>
          <button
            onClick={() => setActiveTool('bulletin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'bulletin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Síntesis Pedagógica de Boletines
          </button>
          <button
            onClick={() => setActiveTool('syllabus')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'syllabus'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Asistente Curricular & Sílabo
          </button>
        </div>
      </div>

      {/* Tool 1: Early Warning Risk Predictor */}
      {activeTool === 'risk' && (
        <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Detector de Riesgo Académico & Deserción Temprana</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Identifica estudiantes con promedio por debajo del umbral mínimo de 3.0 y diseña un plan de acompañamiento tutorial.
              </p>
            </div>
            <button
              onClick={handleGenerateRiskAnalysis}
              disabled={riskLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              {riskLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analizando cohortes con Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ejecutar Diagnóstico AI</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Cohorte Evaluada en Riesgo:</span>
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Camilo Torres Gil (EST-2025-00055)</div>
                <div className="text-slate-400 text-[11px]">Ingeniería de Sistemas • Semestre 2</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-rose-400 font-bold">GPA: 2.70 / 5.0</div>
                <div className="text-[11px] text-slate-400">Condición: Alerta Condicional</div>
              </div>
            </div>
          </div>

          {riskResult && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-900/60 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Plan de Intervención Generado por Gemini 3.8 Flash:</span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800">
                {riskResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 2: Bulletin Insight */}
      {activeTool === 'bulletin' && (
        <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>Generador de Síntesis Formativa para Boletines Oficiales</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Redacta una evaluación cualitativa con recomendaciones pedagógicas que se imprimen en el boletín.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Nombre del Estudiante:</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Programa Académico:</label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Promedio Ponderado (PPA):</label>
              <input
                type="text"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateBulletin}
            disabled={bulletinLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            {bulletinLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando con Google AI Studio...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generar Síntesis Formativa</span>
              </>
            )}
          </button>

          {bulletinResult && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-900/60 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Evaluación Cualitativa Oficial:</span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800">
                {bulletinResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 3: Syllabus Assistant */}
      {activeTool === 'syllabus' && (
        <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Asistente Inteligente de Sílabo y Rúbricas Docentes</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Crea automáticamente la fundamentación del curso, objetivos de aprendizaje y ponderación de rúbricas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Nombre de la Asignatura:</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Créditos Académicos:</label>
              <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Semestre:</label>
              <input
                type="number"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateSyllabus}
            disabled={syllabusLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            {syllabusLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Diseñando Sílabo con Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Diseñar Sílabo y Rúbricas</span>
              </>
            )}
          </button>

          {syllabusResult && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-900/60 space-y-4">
              <div className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-1 text-sm">Resumen del Sílabo Institucional:</span>
                {syllabusResult.syllabus}
              </div>

              {syllabusResult.rubrics && syllabusResult.rubrics.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300">Rúbrica de Evaluación Propuesta:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {syllabusResult.rubrics.map((r: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>{r.criteria}</span>
                          <span className="text-cyan-400 font-mono">{r.weight}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{r.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
