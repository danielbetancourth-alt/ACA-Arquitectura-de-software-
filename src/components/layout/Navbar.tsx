import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Notification } from '../../types';
import { api } from '../../services/api';
import {
  Bell,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  UserCheck,
  Cpu,
  GraduationCap,
  Layers,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async () => {
    try {
      await api.markNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // ignore
    }
  };

  const roles: { id: UserRole; label: string; desc: string; icon: any }[] = [
    { id: 'Admin', label: 'Administrador', desc: 'Control Total & Auditoría', icon: Shield },
    { id: 'Coordinador', label: 'Coordinador', desc: 'Programas & Matrículas', icon: Layers },
    { id: 'Docente', label: 'Docente', desc: 'Calificaciones 0.0-5.0', icon: BookOpen },
    { id: 'Estudiante', label: 'Estudiante', desc: 'Matrícula & Boletín', icon: GraduationCap },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Campus Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SGA Académico
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                Monolito Modular
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Arquitectura en Capas • Persistencia PostgreSQL / ACID
            </p>
          </div>
        </div>

        {/* Center: Quick RBAC Role Switcher */}
        <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <span className="text-xs text-slate-400 px-2 font-medium flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Rol Activo:
          </span>
          <div className="flex items-center gap-1">
            {roles.map((r) => {
              const active = role === r.id;
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => switchRole(r.id)}
                  title={r.desc}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: AI Badge, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* AI Studio Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-medium">Gemini 3.8 Flash</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) handleMarkAsRead();
              }}
              className="relative p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Notificaciones (RF-11)"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">Notificaciones del Sistema (RF-11)</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAsRead}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No hay notificaciones registradas.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg border text-xs transition ${
                          n.isRead
                            ? 'bg-slate-850/60 border-slate-750 text-slate-400'
                            : 'bg-slate-700/60 border-cyan-500/30 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {n.type === 'GRADE' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                          {n.type === 'ENROLLMENT' && <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
                          {n.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                          {n.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                          {n.type === 'INFO' && <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                          <div>
                            <div className="font-semibold text-white">{n.title}</div>
                            <p className="mt-0.5 text-slate-300 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active User Avatar & Role */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs shadow-inner">
              {user?.fullName ? user.fullName[0] : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold leading-tight text-slate-100">{user?.fullName}</div>
              <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-ping" />
                {role}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Role Switcher Bar */}
      <div className="lg:hidden flex items-center justify-around bg-slate-800/90 py-1.5 px-2 border-t border-slate-700/60 overflow-x-auto">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => switchRole(r.id)}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
              role === r.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </header>
  );
};
