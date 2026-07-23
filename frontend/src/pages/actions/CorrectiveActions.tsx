import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/ui/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../auth/permissions';
import {
  Kanban as KanbanIcon,
  Table as TableIcon,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  User,
  Clock,
  Play,
} from 'lucide-react';
import type { CorrectiveActionStatus } from '../../types';

export const CorrectiveActions: React.FC = () => {
  const { actions, updateActionStatus, users } = useData();
  const { addToast } = useNotifications();
  const { currentUser } = useAuth();
  const canManage = can(currentUser?.role, 'actions.manage');

  // Selected View State: 'kanban' | 'table' | 'calendar'
  const [activeView, setActiveView] = useState<'kanban' | 'table' | 'calendar'>('kanban');

  // Calendar helpers
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // Fixed to July 2026 for consistent rendering of demo data

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getStatusBadge = (status: CorrectiveActionStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'in_review':
        return <Badge variant="warning" size="sm">In Review</Badge>;
      case 'in_progress':
        return <Badge variant="primary" size="sm">In Progress</Badge>;
      default:
        return <Badge variant="neutral" size="sm">To Do</Badge>;
    }
  };

  // Switch column helpers for Kanban (simulate drag-and-drop workflow via click transition)
  const advanceActionStatus = (actionId: string, currentStatus: CorrectiveActionStatus) => {
    if (!canManage) {
      addToast('Votre rôle ne permet pas de modifier les actions correctives.', 'warning');
      return;
    }
    let nextStatus: CorrectiveActionStatus = 'todo';
    if (currentStatus === 'todo') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'in_review';
    else if (currentStatus === 'in_review') nextStatus = 'completed';
    else return; // already completed

    updateActionStatus(actionId, nextStatus);
    addToast(`Action advanced to ${nextStatus.replace('_', ' ')}.`, 'info');
  };

  // Calendar rendering grid generator
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    
    // Empty padding slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Day slots
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Remediation Corrective Actions</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Remediate gaps identified during compliance audit runs</p>
        </div>

        {/* View Switches */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveView('kanban')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeView === 'kanban' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            <KanbanIcon className="h-4 w-4" />
            Kanban
          </button>
          
          <button
            onClick={() => setActiveView('table')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeView === 'table' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            <TableIcon className="h-4 w-4" />
            Table
          </button>
          
          <button
            onClick={() => setActiveView('calendar')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeView === 'calendar' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </button>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Columns configuration */}
          {([
            { id: 'todo', label: 'To Do', border: 'border-t-slate-400 bg-slate-100/50 dark:bg-slate-900/10' },
            { id: 'in_progress', label: 'In Progress', border: 'border-t-blue-500 bg-blue-500/5' },
            { id: 'in_review', label: 'In Review', border: 'border-t-amber-500 bg-amber-500/5' },
            { id: 'completed', label: 'Completed', border: 'border-t-emerald-500 bg-emerald-500/5' },
          ] as const).map((col) => {
            const columnActions = actions.filter((a) => a.status === col.id);

            return (
              <div
                key={col.id}
                className={`p-4 rounded-2xl border-t-4 border border-x-slate-200/50 border-b-slate-200/50 dark:border-x-slate-800 dark:border-b-slate-800 flex flex-col gap-4 min-h-[500px] ${col.border}`}
              >
                <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {col.label}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {columnActions.length}
                  </Badge>
                </div>

                <div className="space-y-3.5 overflow-y-auto max-h-[420px] pr-1">
                  {columnActions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs italic">
                      Empty Column
                    </div>
                  ) : (
                    columnActions.map((act) => {
                      const assignee = users.find((u) => u.id === act.assignee);

                      return (
                        <div
                          key={act.id}
                          className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-3.5 rounded-xl shadow-sm flex flex-col gap-3 group transition-all hover:shadow-md"
                        >
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                            ID: {act.id}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                            {act.text}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-450">
                              <User className="h-3.5 w-3.5 text-slate-350" />
                              <span className="truncate max-w-[80px] font-semibold">{assignee?.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {act.dueDate}
                            </span>
                          </div>

                          {/* Quick Advance button (only for roles that manage actions) */}
                          {act.status !== 'completed' && canManage && (
                            <button
                              onClick={() => advanceActionStatus(act.id, act.status)}
                              className="w-full mt-1.5 py-1.5 border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-[9px] font-bold text-primary dark:text-primary-light uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1"
                            >
                              Advance State
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {activeView === 'table' && (
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/35 border-b border-slate-200/60 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Action ID</th>
                  <th className="px-6 py-4">Action Description</th>
                  <th className="px-6 py-4">Responsible Owner</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Advance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {actions.map((act) => {
                  const assignee = users.find((u) => u.id === act.assignee);

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold uppercase">{act.id}</td>
                      <td className="px-6 py-4 max-w-xs truncate font-semibold">{act.text}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold">{assignee?.name}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-350">{act.dueDate}</td>
                      <td className="px-6 py-4">{getStatusBadge(act.status)}</td>
                      <td className="px-6 py-4 text-right">
                        {act.status !== 'completed' && canManage ? (
                          <button
                            onClick={() => advanceActionStatus(act.id, act.status)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-xs font-bold text-primary dark:text-primary-light transition-colors"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Advance
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">{act.status === 'completed' ? 'Closed' : '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CALENDAR VIEW */}
      {activeView === 'calendar' && (
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
          {/* Calendar month selector header */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Grid Layout of the Month */}
          <div>
            {/* Weekdays header */}
            <div className="calendar-grid text-center font-bold text-xs text-slate-400 py-2.5">
              {weekDays.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Monthly numbers grid */}
            <div className="calendar-grid border-l border-t border-slate-100 dark:border-slate-800 text-xs">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[90px] border-r border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/5"
                    />
                  );
                }

                const dayStr = day.toISOString().split('T')[0];
                const dayActions = actions.filter((a) => a.dueDate === dayStr);

                return (
                  <div
                    key={dayStr}
                    className="min-h-[90px] p-2 border-r border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 flex flex-col justify-between"
                  >
                    <span className="font-bold text-slate-550 dark:text-slate-450">{day.getDate()}</span>
                    
                    {/* Render bubbles if actions fall on this day */}
                    <div className="space-y-1">
                      {dayActions.map((act) => (
                        <div
                          key={act.id}
                          className={`p-1 rounded text-[9px] font-bold leading-tight truncate border ${
                            act.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400'
                          }`}
                          title={act.text}
                        >
                          {act.id.toUpperCase()}: {act.text}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
