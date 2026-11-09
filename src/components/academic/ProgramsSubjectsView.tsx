import React, { useState, useEffect } from 'react';
import { Program, Subject } from '../../types';
import { api } from '../../services/api';
import { BookOpen, Award, CheckCircle2, ArrowRight, Layers, GraduationCap } from 'lucide-react';

export const ProgramsSubjectsView: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const progList = await api.getPrograms();
        setPrograms(progList);
        if (progList.length > 0) {
          setSelectedProgramId(progList[0].id);
        }
      } catch (e) {
        console.error('Error fetching programs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedProgramId) return;
    const fetchSubjects = async () => {
      try {
        const subList = await api.getSubjects(selectedProgramId);
        setSubjects(subList);
      } catch (e) {
        console.error('Error fetching subjects:', e);
      }
    };
    fetchSubjects();
  }, [selectedProgramId]);

  const activeProgram = programs.find((p) => p.id === selectedProgramId);

  // Group subjects by semester
  const semestersMap: Record<number, Subject[]> = {};
  subjects.forEach((s) => {
    if (!semestersMap[s.semester]) semestersMap[s.semester] = [];
    semestersMap[s.semester].push(s);
  });

  const semesterNumbers = Object.keys(semestersMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">Administración de Programas y Asignaturas (RF-05)</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Malla curricular, estructuración de créditos académicos y cadena de prerrequisitos obligatorios.
        </p>
      </div>

      {/* Program Selection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {programs.map((p) => {
          const isSelected = p.id === selectedProgramId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProgramId(p.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Program Details Banner */}
      {activeProgram && (
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Código Oficial</span>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{activeProgram.code}</div>
          </div>
          <div>
            <span className="text-slate-400">Facultad</span>
            <div className="text-sm font-bold text-white mt-0.5">{activeProgram.faculty}</div>
          </div>
          <div>
            <span className="text-slate-400">Título Otorgado</span>
            <div className="text-sm font-bold text-indigo-300 mt-0.5">{activeProgram.degreeTitle}</div>
          </div>
          <div>
            <span className="text-slate-400">Duración y Créditos</span>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              {activeProgram.durationSemesters} sem. • {activeProgram.totalCredits} Créditos
            </div>
          </div>
        </div>
      )}

      {/* Curricular Mesh Grid (Malla Curricular por Semestres) */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Malla Curricular y Línea de Prerrequisitos</span>
        </h2>

        {semesterNumbers.length === 0 ? (
          <div className="text-center py-10 bg-slate-850 rounded-2xl border border-slate-800 text-xs text-slate-400">
            No se encontraron asignaturas registradas para este programa.
          </div>
        ) : (
          <div className="space-y-4">
            {semesterNumbers.map((semNum) => (
              <div key={semNum} className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 font-mono font-bold text-xs border border-indigo-800">
                      Nivel {semNum}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">Semestre Académico {semNum}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {semestersMap[semNum].reduce((acc, curr) => acc + curr.credits, 0)} Créditos Académicos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {semestersMap[semNum].map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {sub.code}
                        </span>
                        <span className="font-bold text-amber-300 text-[11px]">{sub.credits} Créditos</span>
                      </div>

                      <h3 className="font-bold text-white text-xs leading-snug">{sub.name}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{sub.description}</p>

                      {sub.prerequisiteCode ? (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-indigo-300 font-mono">
                          <span className="text-slate-500">Prerrequisito:</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-200 border border-indigo-800">
                            {sub.prerequisiteCode}
                          </span>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                          Sin prerrequisitos previos
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
