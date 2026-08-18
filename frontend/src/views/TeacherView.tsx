import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { TeacherDashboardTab } from './TeacherDashboardTab';
import { TeacherGradingTab } from './TeacherGradingTab';
import { TeacherHomeworkTab } from './TeacherHomeworkTab';
import { TeacherLessonPlansTab } from './TeacherLessonPlansTab';

export function TeacherView() {
  const { teacherActiveTab, setTeacherActiveTab } = useOutletContext<any>();
  const activeTab = teacherActiveTab || 'DASHBOARD';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tab View Content */}
      <div>
        {activeTab === 'DASHBOARD' && <TeacherDashboardTab onNavigate={(tab) => setTeacherActiveTab && setTeacherActiveTab(tab as any)} />}
        {activeTab === 'GRADING' && <TeacherGradingTab />}
        {activeTab === 'HOMEWORK' && <TeacherHomeworkTab />}
        {activeTab === 'LESSON_PLANS' && <TeacherLessonPlansTab />}
      </div>
    </div>
  );
}
