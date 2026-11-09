import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Award,
  FileText,
  ShieldCheck,
  Sparkles,
  Code2,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'academic'
  | 'schedules'
  | 'enrollment'
  | 'grades'
  | 'transcript'
  | 'audit'
  | 'ai-hub'
  | 'architecture';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { role } = useAuth();

  const allNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Panel General',
      icon: LayoutDashboard,
      badge: 'KPIs',
      roles: ['Admin', 'Coordinador', 'Docente', 'Estudiante'],
    },
    {
      id: 'students' as NavTab,
      label: 'Estudiantes',
      icon: GraduationCap,
      badge: 'RF-03',
      roles: ['Admin', 'Coordinador', 'Docente'],
    },
    {
      id: 'teachers' as NavTab,
      label: 'Docentes',
      icon: Users,
      badge: 'RF-04',
      roles: ['Admin', 'Coordinador'],
    },
    {
      id: 'academic' as NavTab,
      label: 'Programas & Malla',
      icon: BookOpen,
      badge: 'RF-05',
      roles: ['Admin', 'Coordinador', 'Docente', 'Estudiante'],
    },
    {
      id: 'schedules' as NavTab,
      label: 'Periodos & Horarios',
      icon: Calendar,
      badge: 'RF-06',
      roles: ['Admin', 'Coordinador', 'Docente', 'Estudiante'],
    },
    {
      id: 'enrollment' as NavTab,
      label: 'Matrícula de Cupos',
      icon: ClipboardCheck,
      badge: 'RF-07',
      roles: ['Admin', 'Coordinador', 'Estudiante'],
    },
    {
      id: 'grades' as NavTab,
      label: 'Calificaciones 0.0-5.0',
      icon: Award,
      badge: 'RF-08',
      roles: ['Admin', 'Coordinador', 'Docente', 'Estudiante'],
    },
    {
      id: 'transcript' as NavTab,
      label: 'Boletín & Historial',
      icon: FileText,
      badge: 'RF-09,10',
      roles: ['Admin', 'Coordinador', 'Docente', 'Estudiante'],
    },
    {
      id: 'audit' as NavTab,
      label: 'Bitácora de Auditoría',
      icon: ShieldCheck,
      badge: 'RF-12',
      roles: ['Admin', 'Coordinador'],
    },
    {
      id: 'ai-hub' as NavTab,
      label: 'Google AI Studio Hub',
      icon: Sparkles,
      badge: 'Gemini',
      roles: ['Admin', 'Coordinador', 'Docente', 'Estudiante'],
    },
    {
      id: 'architecture' as NavTab,
      label: 'Arquitectura FastAPI',
      icon: Code2,
      badge: 'Code/ACID',
      roles: ['Admin', 'Coordinador', 'Docente', 'Estudiante'],
    },
  ];

  const visibleItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navegación del Sistema
          </div>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-700/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-indigo-900/60 text-indigo-100 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Technical Architecture Badge */}
        <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-[11px] space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Arquitectura Validada</span>
          </div>
          <ul className="text-slate-400 space-y-1 leading-snug">
            <li>• Monolito Modular Desacoplado</li>
            <li>• Persistencia ACID (Row Locks)</li>
            <li>• Concurrencia 300 users</li>
            <li>• Auditoría Inmutable SHA-256</li>
            <li>• Google AI Studio (3.8 Flash)</li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>Versión 1.0.0</span>
          <span className="font-mono text-emerald-400">HTTP 200 OK</span>
        </div>
      </div>
    </aside>
  );
};
