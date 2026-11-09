import React, { useState, useEffect } from 'react';
import { PythonCodeFile } from '../../types';
import { api } from '../../services/api';
import {
  Code2,
  Database,
  Layers,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';

export const BackendArchitectureExplorer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'diagram' | 'code' | 'acid'>('diagram');
  const [files, setFiles] = useState<PythonCodeFile[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>('main.py');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const data = await api.getPythonCodeFiles();
        setFiles(data);
        if (data.length > 0) {
          setSelectedFileName(data[0].name);
        }
      } catch (e) {
        console.error('Error fetching code files:', e);
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, []);

  const selectedFile = files.find((f) => f.name === selectedFileName) || files[0];

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Arquitectura de Software & Backend FastAPI</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Estructura del proyecto Monolito Modular en capas, persistencia ACID (PostgreSQL) y código fuente Python listo para producción.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex bg-slate-850 p-1 rounded-xl border border-slate-750 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('diagram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'diagram'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Diagrama de Capas
          </button>
          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Explorador de Código Python
          </button>
          <button
            onClick={() => setActiveSubTab('acid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'acid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aislamiento ACID & Concurrencia
          </button>
        </div>
      </div>

      {/* View 1: Layered Monolith Diagram */}
      {activeSubTab === 'diagram' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Arquitectura en Capas: Monolito Modular (RNF-05)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* Layer 1: Presentation */}
              <div className="p-4 rounded-xl bg-slate-900 border border-indigo-900/60 space-y-2">
                <div className="flex items-center justify-between font-bold text-indigo-300">
                  <span>1. Capa de Presentación</span>
                  <Server className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  FastAPI Routers, schemas Pydantic de entrada/salida y serialización JSON. Control de autenticación Bearer JWT y
                  validación de roles RBAC.
                </p>
                <div className="font-mono text-[10px] text-cyan-400 pt-1">
                  routers/ [auth, students, academic, grades, reports, audit, ai]
                </div>
              </div>

              {/* Layer 2: Business Logic / Application */}
              <div className="p-4 rounded-xl bg-slate-900 border border-blue-900/60 space-y-2">
                <div className="flex items-center justify-between font-bold text-blue-300">
                  <span>2. Capa de Servicios</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Lógica de negocio transaccional: verificación de cupos, reglas de aprobación de 0.0 a 5.0, cortes 30%-30%-40%, y
                  despacho de eventos.
                </p>
                <div className="font-mono text-[10px] text-amber-300 pt-1">
                  services/ [academic_service.py, ai_service.py]
                </div>
              </div>

              {/* Layer 3: Decoupled Audit */}
              <div className="p-4 rounded-xl bg-slate-900 border border-purple-900/60 space-y-2">
                <div className="flex items-center justify-between font-bold text-purple-300">
                  <span>3. Auditoría Desacoplada</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Event Bus in-memory no bloqueante (Observer pattern). Registra mutaciones inmutables con hash SHA-256 sin acoplar
                  los servicios principales.
                </p>
                <div className="font-mono text-[10px] text-purple-300 pt-1">
                  audit/ [event_bus.py, service.py]
                </div>
              </div>

              {/* Layer 4: Persistence ACID */}
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-300">
                  <span>4. Persistencia ACID</span>
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  PostgreSQL con SQLAlchemy Async. Restricciones CheckConstraint, llaves foráneas en cascada y bloqueos SELECT ... FOR UPDATE.
                </p>
                <div className="font-mono text-[10px] text-emerald-400 pt-1">
                  database/ [models.py, session.py]
                </div>
              </div>
            </div>

            {/* Architecture Highlights Table */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3">
              <h3 className="font-bold text-white text-xs">Cumplimiento de Estándares No Funcionales:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                  <strong className="text-indigo-300 block">RNF-01 (Seguridad):</strong>
                  Cifrado de credenciales con bcrypt y tokens JWT firmados con HS256.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                  <strong className="text-indigo-300 block">RNF-02 (Rendimiento):</strong>
                  Respuestas asíncronas indexadas garantizando latencias menores a 3 segundos.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                  <strong className="text-indigo-300 block">RNF-03 (Concurrencia):</strong>
                  Bloqueo a nivel de fila para tolerar hasta 300 usuarios simultáneos en matrícula.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                  <strong className="text-indigo-300 block">RNF-07 (Integridad ACID):</strong>
                  Atomicidad y consistencia en la mutación de cupos y notas.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                  <strong className="text-indigo-300 block">RNF-10 (Trazabilidad):</strong>
                  Registro inmutable con diff antes/después y hash SHA-256.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                  <strong className="text-indigo-300 block">RNF-11 (Tolerancia a Fallos):</strong>
                  Manejador global de excepciones con códigos HTTP normalizados.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Python Code Files Explorer */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* File Selector Sidebar */}
          <div className="lg:col-span-1 p-3 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-2">
              Estructura del Proyecto
            </span>
            <div className="space-y-1">
              {files.map((f) => {
                const isSelected = f.name === selectedFileName;
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFileName(f.name)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-slate-900/60 text-slate-300 border border-slate-700/50">
                      {f.category.slice(0, 10)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-3 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-white">{selectedFile?.path}</span>
                <span className="text-[11px] text-indigo-300 font-sans">({selectedFile?.category})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>
            </div>

            <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                <code>{selectedFile?.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* View 3: ACID Transactions & Concurrency */}
      {activeSubTab === 'acid' && (
        <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-6">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Garantía de Integridad ACID y Concurrencia (RNF-03 & RNF-07)</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              El Sistema de Gestión Académica (SGA) previene inconsistencias mediante los principios fundamentales de
              transacciones de base de datos relacionales:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 font-mono text-sm block">A - Atomicidad (Atomicity)</span>
              <p className="text-slate-300 leading-relaxed">
                Toda matrícula de asignatura o registro de notas se ejecuta en un bloque transaccional indivisible (
                <code>async with AsyncSessionLocal() as session</code>). Si ocurre cualquier error o se exceden los cupos, se
                ejecuta un <code>ROLLBACK</code> automático que revierte cualquier cambio intermedio.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-400 font-mono text-sm block">C - Consistencia (Consistency)</span>
              <p className="text-slate-300 leading-relaxed">
                Las restricciones relacionales de PostgreSQL garantizan que el contador de matriculados nunca supere la
                capacidad (<code>CHECK (enrolled_count &lt;= total_quota)</code>) y que las calificaciones pertenezcan
                estrictamente al rango válido de 0.0 a 5.0.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-amber-400 font-mono text-sm block">I - Aislamiento (Isolation)</span>
              <p className="text-slate-300 leading-relaxed">
                Para resolver el requerimiento de soportar hasta 300 usuarios simultáneos en época de matrícula sin
                condición de carrera (Race Condition), se aplica un bloqueo a nivel de fila (<code>SELECT ... FOR UPDATE</code>)
                sobre la tupla del horario, serializando las peticiones concurrentes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-purple-400 font-mono text-sm block">D - Durabilidad (Durability)</span>
              <p className="text-slate-300 leading-relaxed">
                Una vez confirmada la transacción mediante <code>COMMIT</code>, los registros persisten en el volumen seguro
                de PostgreSQL y se emite de forma asíncrona el registro inmutable a la bitácora de auditoría con su hash criptográfico.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
