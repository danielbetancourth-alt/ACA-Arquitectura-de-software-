import React, { useState, useEffect } from 'react';
import { Teacher } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Mail, BookOpen, Award, CheckCircle2, Shield } from 'lucide-react';

export const TeachersManager: React.FC = () => {
  const { role } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    employeeCode: '',
    department: 'Ingeniería de Software & Computación',
    specialty: 'Sistemas Distribuidos y Arquitectura',
    academicDegree: 'Doctorado en Ciencias de la Computación (PhD)',
    contractType: 'Tiempo Completo',
  });

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (e) {
      console.error('Error loading teachers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      fullName: '',
      email: '',
      employeeCode: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      department: 'Ingeniería de Software & Computación',
      specialty: 'Sistemas Distribuidos y Arquitectura',
      academicDegree: 'Doctorado en Ciencias de la Computación (PhD)',
      contractType: 'Tiempo Completo',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTeacher(formData);
      setIsModalOpen(false);
      loadTeachers();
    } catch (err: any) {
      alert(`Error al registrar docente: ${err.message}`);
    }
  };

  const canMutate = role === 'Admin' || role === 'Coordinador';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Gestión de Docentes (RF-04)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Administración del cuerpo profesoral, departamentos académicos y escalafón docente.
          </p>
        </div>

        {canMutate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Docente</span>
          </button>
        )}
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-slate-400 text-xs">Cargando docentes...</div>
        ) : teachers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-400 text-xs">No hay docentes registrados.</div>
        ) : (
          teachers.map((tch) => (
            <div key={tch.id} className="p-5 rounded-2xl bg-slate-850 border border-slate-800 shadow-sm space-y-4 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{tch.fullName}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{tch.email}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {tch.employeeCode}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{tch.department}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{tch.academicDegree}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  <span className="text-slate-300 font-medium">Especialidad:</span> {tch.specialty}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{tch.contractType}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Activo
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create Teacher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Registrar Nuevo Docente (RF-04)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dr. Mario Delgado"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Correo Institucional *</label>
                  <input
                    type="email"
                    required
                    placeholder="mario.delgado@sga.edu.co"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Código de Empleado *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Departamento Académico *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Ingeniería de Software & Computación">Ingeniería de Software & Computación</option>
                  <option value="Ciencias Básicas y Matemáticas">Ciencias Básicas y Matemáticas</option>
                  <option value="Ciencias Jurídicas">Ciencias Jurídicas</option>
                  <option value="Ciencias de la Salud">Ciencias de la Salud</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Título Académico Máximo</label>
                  <select
                    value={formData.academicDegree}
                    onChange={(e) => setFormData({ ...formData, academicDegree: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Doctorado en Ciencias (PhD)">Doctorado en Ciencias (PhD)</option>
                    <option value="Maestría / Magíster (MSc)">Maestría / Magíster (MSc)</option>
                    <option value="Especialización">Especialización</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Contrato</label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tiempo Completo">Tiempo Completo</option>
                    <option value="Medio Tiempo">Medio Tiempo</option>
                    <option value="Cátedra">Cátedra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Área de Especialidad</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
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
                  Guardar Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
