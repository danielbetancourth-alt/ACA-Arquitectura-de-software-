import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';
import {
  ShieldCheck,
  Search,
  Filter,
  Lock,
  ChevronDown,
  ChevronUp,
  Hash,
  Activity,
  Terminal,
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(actionFilter, entityFilter, 100);
      setLogs(data);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.actorEmail.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q) ||
      log.integrityHash.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold text-white">Bitácora de Auditoría Desacoplada (RF-12 & RNF-10)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro inmutable de mutaciones de datos (Event Bus Observer) con firma de integridad SHA-256 por evento.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start sm:self-auto"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Refrescar Bitácora</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por usuario, entidad o hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todas las Acciones</option>
            <option value="ENROLL">ENROLL (Matrícula Atómica)</option>
            <option value="GRADE_MUTATION">GRADE_MUTATION (Calificación)</option>
            <option value="CREATE">CREATE (Creación de Registro)</option>
            <option value="UPDATE">UPDATE (Modificación)</option>
            <option value="LOGIN">LOGIN (Acceso al Sistema)</option>
            <option value="STRESS_TEST">STRESS_TEST (Test Concurrencia)</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todas las Entidades</option>
            <option value="Enrollment">Enrollment (Matrícula)</option>
            <option value="Grade">Grade (Nota)</option>
            <option value="Student">Student (Estudiante)</option>
            <option value="Teacher">Teacher (Docente)</option>
            <option value="User">User (Usuario)</option>
            <option value="Schedule">Schedule (Horario)</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl bg-slate-850 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Actor Responsable</th>
                <th className="py-3 px-4 text-center">Acción</th>
                <th className="py-3 px-4">Entidad / ID</th>
                <th className="py-3 px-4">IP Origen</th>
                <th className="py-3 px-4">Hash SHA-256</th>
                <th className="py-3 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Consultando bitácora inmutable...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No se encontraron registros de auditoría que coincidan con el criterio.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isGradeMutation = log.action === 'GRADE_MUTATION';
                  const isEnroll = log.action === 'ENROLL';

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{log.actorEmail}</div>
                          <span className="text-[10px] text-indigo-400 font-mono">Rol: {log.actorRole}</span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              isGradeMutation
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : isEnroll
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : log.action === 'CREATE'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : log.action === 'STRESS_TEST'
                                ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{log.entity}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                            {log.entityId}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.ipAddress}</td>

                        <td className="py-3 px-4 font-mono text-[10px] text-purple-300">
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate max-w-[110px]" title={log.integrityHash}>
                              {log.integrityHash.slice(0, 14)}...
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Ver Estado Previo y Posterior"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Diff Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90">
                          <td colSpan={7} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Estado Anterior (Before State):</span>
                                </div>
                                <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800/80 text-[11px]">
                                  {log.beforeState ? JSON.stringify(JSON.parse(log.beforeState), null, 2) : 'null (Creación inicial)'}
                                </pre>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Estado Posterior (After State):</span>
                                </div>
                                <pre className="text-emerald-300 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800/80 text-[11px]">
                                  {log.afterState ? JSON.stringify(JSON.parse(log.afterState), null, 2) : 'null'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
