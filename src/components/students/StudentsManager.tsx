import React, { useState, useEffect } from 'react';
import { Student, Program } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  FileText,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  BookOpen,
} from 'lucide-react';

interface StudentsManagerProps {
  onViewTranscript?: (studentId: string) => void;
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({ onViewTranscript }) => {
  const { role } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: 'stu123',
    documentId: '',
    studentCode: '',
    programId: '',
    currentSemester: 1,
    phone: '',
    status: 'Regular',
    gpa: 0.0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuList, progList] = await Promise.all([
        api.getStudents(search, selectedProgram),
        api.getPrograms(),
      ]);
      setStudents(stuList);
      setPrograms(progList);
      if (progList.length > 0 && !formData.programId) {
        setFormData((prev) => ({ ...prev, programId: progList[0].id }));
      }
    } catch (e) {
      console.error('Error loading students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedProgram]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentStudentId(null);
    setFormData({
      fullName: '',
      email: '',
      password: 'stu123',
      documentId: '',
      studentCode: `EST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      programId: programs[0]?.id || '',
      currentSemester: 1,
      phone: '+57 3',
      status: 'Regular',
      gpa: 0.0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stu: Student) => {
    setIsEditing(true);
    setCurrentStudentId(stu.id);
    setFormData({
      fullName: stu.fullName || '',
      email: stu.email || '',
      password: '',
      documentId: stu.documentId,
      studentCode: stu.studentCode,
      programId: stu.programId,
      currentSemester: stu.currentSemester,
      phone: stu.phone,
      status: stu.status,
      gpa: stu.gpa,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentStudentId) {
        await api.updateStudent(currentStudentId, formData);
      } else {
        await api.createStudent(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const canMutate = role === 'Admin' || role === 'Coordinador';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Gestión de Estudiantes (RF-03)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro, actualización y administración del perfil académico de los estudiantes.
          </p>
        </div>

        {canMutate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Estudiante</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todos los Programas</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-xl bg-slate-850 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">Código / Doc</th>
                <th className="py-3 px-4">Programa Académico</th>
                <th className="py-3 px-4 text-center">Semestre</th>
                <th className="py-3 px-4 text-center">PPA (GPA)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Cargando estudiantes...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No se encontraron estudiantes registrados.
                  </td>
                </tr>
              ) : (
                students.map((stu) => {
                  const isHighGpa = stu.gpa >= 4.5;
                  const isLowGpa = stu.gpa > 0 && stu.gpa < 3.0;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{stu.fullName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{stu.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-indigo-300 font-bold">{stu.studentCode}</div>
                        <div className="text-slate-500">CC: {stu.documentId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{stu.programName}</div>
                        <div className="text-[10px] text-slate-500">{stu.faculty}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                          Sem. {stu.currentSemester}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            isHighGpa
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isLowGpa
                              ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                              : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {stu.gpa ? stu.gpa.toFixed(2) : '0.00'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            stu.status === 'Regular'
                              ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                          }`}
                        >
                          {stu.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onViewTranscript && (
                            <button
                              onClick={() => onViewTranscript(stu.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                              title="Ver Boletín Oficial de Calificaciones"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canMutate && (
                            <button
                              onClick={() => handleOpenEdit(stu)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Editar Estudiante"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Editar Información del Estudiante' : 'Registrar Nuevo Estudiante (RF-03)'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    disabled={isEditing}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cédula / Documento *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    value={formData.documentId}
                    onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Código Estudiantil *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Programa Académico *</label>
                  <select
                    value={formData.programId}
                    disabled={isEditing}
                    onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Semestre Actual</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.currentSemester}
                    onChange={(e) => setFormData({ ...formData, currentSemester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Condicional">Condicional</option>
                    <option value="Graduado">Graduado</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {isEditing ? 'Guardar Cambios' : 'Crear Estudiante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
