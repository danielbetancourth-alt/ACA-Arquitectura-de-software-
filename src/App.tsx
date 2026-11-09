import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardRouter } from './components/dashboard/DashboardRouter';
import { StudentsManager } from './components/students/StudentsManager';
import { TeachersManager } from './components/teachers/TeachersManager';
import { ProgramsSubjectsView } from './components/academic/ProgramsSubjectsView';
import { PeriodsSchedulesView } from './components/academic/PeriodsSchedulesView';
import { EnrollmentView } from './components/enrollment/EnrollmentView';
import { GradesManager } from './components/grades/GradesManager';
import { AcademicTranscriptView } from './components/reports/AcademicTranscriptView';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { AIAcademicHub } from './components/ai/AIAcademicHub';
import { BackendArchitectureExplorer } from './components/architecture/BackendArchitectureExplorer';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedStudentForTranscript, setSelectedStudentForTranscript] = useState<string | undefined>(undefined);
  const { role } = useAuth();

  const handleViewTranscript = (studentId: string) => {
    setSelectedStudentForTranscript(studentId);
    setCurrentTab('transcript');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && <DashboardRouter onNavigate={setCurrentTab} />}
          {currentTab === 'students' && <StudentsManager onViewTranscript={handleViewTranscript} />}
          {currentTab === 'teachers' && <TeachersManager />}
          {currentTab === 'academic' && <ProgramsSubjectsView />}
          {currentTab === 'schedules' && <PeriodsSchedulesView />}
          {currentTab === 'enrollment' && <EnrollmentView />}
          {currentTab === 'grades' && <GradesManager />}
          {currentTab === 'transcript' && (
            <AcademicTranscriptView initialStudentId={selectedStudentForTranscript} />
          )}
          {currentTab === 'audit' && <AuditLogViewer />}
          {currentTab === 'ai-hub' && <AIAcademicHub />}
          {currentTab === 'architecture' && <BackendArchitectureExplorer />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
