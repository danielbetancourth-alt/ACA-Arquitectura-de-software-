import React, { useState, useEffect } from 'react';
import { Schedule, GradeItem } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  User,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const GradesManager: React.FC = () => {
  const { role, user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [gradesList, setGradesList] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Local draft inputs state
  const [draftGrades, setDraftGrades] = useState<
    Record<string, { corte1: string; corte2: string; corte3: string }>
  >({});

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const list = await api.getSchedules();
        setSchedules(list);
        if (list.length > 0) {
          setSelectedScheduleId(list[0].id);
        }
      } catch (e) {
        console.error('Error fetching schedules:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const loadGrades = async (scheduleId: string) => {
    if (!scheduleId) return;
    setLoading(true);
    setSuccessNotice(null);
    setErrorNotice(null);
    try {
      const data = await api.getGradesBySchedule(scheduleId);
      setGradesList(data);

      const drafts: Record<string, { corte1: string; corte2: string; corte3: string }> = {};
      data.forEach((item) => {
        drafts[item.enrollmentId] = {
          corte1: item.corte1 !== null ? item.corte1.toString() : '',
          corte2: item.corte2 !== null ? item.corte2.toString() : '',
          corte3: item.corte3 !== null ? item.corte3.toString() : '',
        };
      });
      setDraftGrades(drafts);
    } catch (e) {
      console.error('Error loading grades:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedScheduleId) {
      loadGrades(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  const handleInputChange = (enrollmentId: string, field: 'corte1' | 'corte2' | 'corte3', value: string) => {
    setDraftGrades((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: value,
      },
    }));
  };

  const handleSaveRow = async (enrollmentId: string) => {
    const draft = draftGrades[enrollmentId];
    if (!draft) return;

    setSavingId(enrollmentId);
    setSuccessNotice(null);
    setErrorNotice(null);

    // Validate 0.0 to 5.0
    const parse = (val: string, label: string): number | null => {
      if (!val || val.trim() === '') return null;
      const n = parseFloat(val);
      if (isNaN(n) || n < 0.0 || n > 5.0) {
        throw new Error(`La nota de ${label} debe estar en el rango de 0.0 a 5.0`);
      }
      return n;
    };

    try {
      const c1 = parse(draft.corte1, 'Corte 1');
      const c2 = parse(draft.corte2, 'Corte 2');
      const c3 = parse(draft.corte3, 'Corte 3');

      const res = await api.registerGrade({
        enrollmentId,
        corte1: c1,
        corte2: c2,
        corte3: c3,
      });

      setSuccessNotice(`Calificaciones actualizadas exitosamente para la matrícula. Definitiva: ${res.final_grade ?? 'Pendiente'}`);
      await loadGrades(selectedScheduleId);
    } catch (err: any) {
      setErrorNotice(err.message || 'Error al guardar calificaciones.');
    } finally {
      setSavingId(null);
    }
  };

  const canEdit = role === 'Admin' || role === 'Coordinador' || role === 'Docente';
  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Registro de Calificaciones (RF-08)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Escala oficial de 0.0 a 5.0. Ponderación por cortes: Corte 1 (30%), Corte 2 (30%), Corte 3 (40%).
          </p>
        </div>

        {/* Schedule Selector */}
        <div className="sm:w-80">
          <label className="block text-[11px] text-slate-400 mb-1">Seleccionar Grupo / Asignatura:</label>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectName} — {s.classroom} ({s.teacherName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Course Header Banner */}
      {selectedSchedule && (
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Asignatura</span>
            <div className="font-bold text-white text-sm mt-0.5">{selectedSchedule.subjectName}</div>
          </div>
          <div>
            <span className="text-slate-400">Docente a Cargo</span>
            <div className="font-bold text-indigo-300 mt-0.5">{selectedSchedule.teacherName}</div>
          </div>
          <div>
            <span className="text-slate-400">Horario & Salón</span>
            <div className="font-bold text-white font-mono mt-0.5">
              {selectedSchedule.dayOfWeek} ({selectedSchedule.classroom})
            </div>
          </div>
          <div>
            <span className="text-slate-400">Estudiantes Matriculados</span>
            <div className="font-bold text-emerald-400 font-mono mt-0.5">
              {gradesList.length} alumnos registrados
            </div>
          </div>
        </div>
      )}

      {/* Notices */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Grades Table */}
      <div className="rounded-xl bg-slate-850 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4 text-center w-28">Corte 1 (30%)</th>
                <th className="py-3 px-4 text-center w-28">Corte 2 (30%)</th>
                <th className="py-3 px-4 text-center w-28">Corte 3 (40%)</th>
                <th className="py-3 px-4 text-center w-28">Definitiva</th>
                <th className="py-3 px-4 text-center">Estado</th>
                {canEdit && <th className="py-3 px-4 text-right">Guardar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Cargando planilla de calificaciones...
                  </td>
                </tr>
              ) : gradesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No hay estudiantes matriculados en este grupo.
                  </td>
                </tr>
              ) : (
                gradesList.map((item) => {
                  const draft = draftGrades[item.enrollmentId] || { corte1: '', corte2: '', corte3: '' };
                  const isApproved = item.approved === true;
                  const isReprobated = item.approved === false;
                  const isSaving = savingId === item.enrollmentId;

                  // Temporary preview of final grade
                  const n1 = parseFloat(draft.corte1);
                  const n2 = parseFloat(draft.corte2);
                  const n3 = parseFloat(draft.corte3);
                  let calculatedPreview: number | null = null;
                  if (!isNaN(n1) && !isNaN(n2) && !isNaN(n3)) {
                    calculatedPreview = Math.round((n1 * 0.3 + n2 * 0.3 + n3 * 0.4) * 100) / 100;
                  }

                  return (
                    <tr key={item.enrollmentId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item.studentName}</div>
                        <div className="text-[11px] text-slate-500">{item.studentEmail}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-300">{item.studentCode}</td>

                      {/* Corte 1 */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0.0"
                          max="5.0"
                          disabled={!canEdit}
                          value={draft.corte1}
                          onChange={(e) => handleInputChange(item.enrollmentId, 'corte1', e.target.value)}
                          placeholder="0.0 - 5.0"
                          className="w-20 text-center px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-70"
                        />
                      </td>

                      {/* Corte 2 */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0.0"
                          max="5.0"
                          disabled={!canEdit}
                          value={draft.corte2}
                          onChange={(e) => handleInputChange(item.enrollmentId, 'corte2', e.target.value)}
                          placeholder="0.0 - 5.0"
                          className="w-20 text-center px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-70"
                        />
                      </td>

                      {/* Corte 3 */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0.0"
                          max="5.0"
                          disabled={!canEdit}
                          value={draft.corte3}
                          onChange={(e) => handleInputChange(item.enrollmentId, 'corte3', e.target.value)}
                          placeholder="0.0 - 5.0"
                          className="w-20 text-center px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-70"
                        />
                      </td>

                      {/* Definitiva */}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span
                          className={`px-2.5 py-1 rounded text-xs ${
                            (calculatedPreview ?? item.finalGrade ?? 0) >= 3.0
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : (calculatedPreview ?? item.finalGrade) !== null
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {calculatedPreview !== null
                            ? calculatedPreview.toFixed(2)
                            : item.finalGrade !== null
                            ? item.finalGrade.toFixed(2)
                            : '—'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        {(calculatedPreview ?? item.finalGrade) === null ? (
                          <span className="text-[10px] text-slate-500 font-mono">En curso</span>
                        ) : (calculatedPreview ?? item.finalGrade)! >= 3.0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Aprobado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                            Reprobado
                          </span>
                        )}
                      </td>

                      {/* Save Action */}
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleSaveRow(item.enrollmentId)}
                            disabled={isSaving}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 ml-auto transition shadow-sm disabled:opacity-50"
                          >
                            {isSaving ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>Guardar</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
