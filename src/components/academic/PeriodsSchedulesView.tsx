import React, { useState, useEffect } from 'react';
import { AcademicPeriod, Schedule } from '../../types';
import { api } from '../../services/api';
import { Calendar, Clock, MapPin, User, Users, CheckCircle2 } from 'lucide-react';

export const PeriodsSchedulesView: React.FC = () => {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pers, schs] = await Promise.all([api.getPeriods(), api.getSchedules()]);
        setPeriods(pers);
        setSchedules(schs);
      } catch (e) {
        console.error('Error fetching schedules:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">Periodos Lectivos y Horarios de Clase (RF-06)</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Calendario académico institucional, asignación docente por aulas y franjas horarias con capacidad de cupos.
        </p>
      </div>

      {/* Academic Periods Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {periods.map((p) => (
          <div key={p.id} className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Periodo {p.code}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Estado: {p.status}
              </span>
            </div>
            <h3 className="font-bold text-sm text-white">{p.name}</h3>
            <div className="text-xs text-slate-400 flex items-center gap-4">
              <span>Inicio: {new Date(p.startDate).toLocaleDateString()}</span>
              <span>Cierre: {new Date(p.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Schedules Matrix */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Distribución Horaria y Aulas Asignadas</span>
        </h2>

        <div className="rounded-xl bg-slate-850 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Asignatura</th>
                  <th className="py-3 px-4">Docente Titular</th>
                  <th className="py-3 px-4">Día / Franja Horaria</th>
                  <th className="py-3 px-4">Aula / Laboratorio</th>
                  <th className="py-3 px-4 text-center">Ocupación de Cupos</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Cargando horarios...
                    </td>
                  </tr>
                ) : (
                  schedules.map((sch) => {
                    const percentage = Math.round((sch.enrolledCount / sch.totalQuota) * 100);
                    const isFull = sch.enrolledCount >= sch.totalQuota;

                    return (
                      <tr key={sch.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{sch.subjectName}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {sch.subjectCode} • {sch.credits} Créditos
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{sch.teacherName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{sch.dayOfWeek}</div>
                          <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                            {sch.startTime} - {sch.endTime}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>{sch.classroom}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-36 mx-auto space-y-1">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-slate-400">
                                {sch.enrolledCount} / {sch.totalQuota}
                              </span>
                              <span className={isFull ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                {sch.availableQuota} libres
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isFull ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isFull
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {isFull ? 'Cupos Agotados' : 'Disponible'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
