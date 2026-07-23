import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { can } from '../../auth/permissions';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';

export const Dashboard: React.FC = () => {
  const { audits, findings, actions, departments, templates } = useData();
  const { currentUser } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  // 1. Calculate KPI Metrics
  // Compliance Rate is the average of completed audit scores
  const completedAudits = audits.filter((a) => a.status === 'closed');
  const overallCompliance =
    completedAudits.length > 0
      ? Math.round(completedAudits.reduce((acc, curr) => acc + curr.score, 0) / completedAudits.length)
      : 85; // fallback

  const openFindingsCount = findings.filter((f) => f.status === 'open' || f.status === 'action_pending').length;
  
  // Overdue actions: status not completed and due date in the past
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueActionsCount = actions.filter(
    (a) => a.status !== 'completed' && a.dueDate < todayStr
  ).length;

  const activeAuditsCount = audits.filter((a) => a.status === 'in_progress').length;

  // 2. Prepare Chart Data
  // Department Statistics data
  const deptChartData = departments.map((dept) => ({
    name: dept.name.split(' ')[0], // short name
    Compliance: dept.complianceRate,
    Findings: findings.filter((f) => {
      const audit = audits.find((a) => a.id === f.auditId);
      return audit?.departmentId === dept.id && f.status !== 'resolved';
    }).length,
  }));

  // Compliance Trend data
  const complianceTrendData = [
    { month: 'Jan', compliance: 78 },
    { month: 'Feb', compliance: 80 },
    { month: 'Mar', compliance: 82 },
    { month: 'Apr', compliance: 81 },
    { month: 'May', compliance: 85 },
    { month: 'Jun', compliance: overallCompliance },
  ];

  // 3. Recent Activities (simulated audit history log)
  const recentActivities = [
    { id: '1', user: 'Marcus Wright', action: 'completed audit', target: 'Q2 Security & Crypto Compliance Audit', time: '2 hours ago', type: 'success' },
    { id: '2', user: 'Sarah Connor', action: 'created checklist template', target: 'ISO 9001 Quality Management System', time: '1 day ago', type: 'info' },
    { id: '3', user: 'John Connor', action: 'resolved non-conformity', target: 'NC-2: Incident handling policy documentation', time: '2 days ago', type: 'warning' },
    { id: '4', user: 'Kyle Reese', action: 'uploaded evidence file', target: 'BitLocker confirmation log.txt', time: '3 days ago', type: 'neutral' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_35%)]" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            {t('dash.welcome', { name: currentUser?.name || 'User' })}
          </h1>
          <p className="text-xs text-blue-150 font-medium">
            {t('dash.overview')}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          {can(currentUser?.role, 'templates.manage') && (
            <button
              onClick={() => navigate('/templates')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs backdrop-blur-md border border-white/10 transition-all"
            >
              <Plus className="h-4 w-4" />
              {t('dash.buildChecklist')}
            </button>
          )}
          {can(currentUser?.role, 'audits.create') && (
            <button
              onClick={() => navigate('/audits')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-blue-800 hover:bg-slate-100 font-extrabold text-xs shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              {t('dash.scheduleAudit')}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Compliance % */}
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('dash.complianceScore')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-primary dark:text-primary-light flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {overallCompliance}%
              </span>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                +2.4%
              </span>
            </div>
            <ProgressBar value={overallCompliance} size="sm" />
          </div>
        </div>

        {/* Card 2: Audits completed */}
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('dash.auditsConducted')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-success flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-0.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {completedAudits.length}
            </span>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
              <span>{activeAuditsCount} {t('dash.inProgress')}</span>
              <span>•</span>
              <span>{audits.filter(a => a.status === 'draft').length} {t('dash.scheduled')}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Open Findings */}
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('dash.openFindings')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-warning flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-0.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {openFindingsCount}
            </span>
            <p className="text-[10px] text-slate-400 font-semibold pt-1">
              {t('dash.actionPendingMgrs')}
            </p>
          </div>
        </div>

        {/* Card 4: Overdue Actions */}
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('dash.overdueActions')}
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-danger flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-0.5">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overdueActionsCount}
            </span>
            <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold pt-1">
              {t('dash.immediateAction')}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend Chart */}
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('dash.complianceTrend')}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('dash.trendSubtitle')}</p>
          </div>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} />
                <YAxis domain={[50, 100]} stroke="#94A3B8" fontSize={10} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="compliance" name={t('dash.complianceRateLegend')} stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorCompliance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Compliance Rates */}
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('dash.deptStats')}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('dash.deptStatsSub')}</p>
          </div>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Compliance" name={t('dash.adherenceLegend')} fill="#2563EB" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Findings" name={t('dash.openFindingsLegend')} fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actionable / Recent Work Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activities */}
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('dash.opsLog')}</h3>
              <p className="text-[10px] text-slate-400 font-semibold">{t('dash.opsLogSub')}</p>
            </div>
            <Link to="/reports" className="text-[10px] font-bold text-primary dark:text-primary-light hover:underline flex items-center gap-0.5">
              {t('dash.viewTrails')}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-slate-200">
                      <span className="font-bold text-slate-950 dark:text-white">{act.user}</span> {act.action}{' '}
                      <span className="font-semibold text-primary dark:text-primary-light">{act.target}</span>
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">{act.time}</span>
                  </div>
                </div>
                <Badge
                  variant={act.type === 'success' ? 'success' : act.type === 'warning' ? 'warning' : act.type === 'info' ? 'info' : 'neutral'}
                  size="sm"
                >
                  {act.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Status widgets */}
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('dash.workspaceHealth')}</h3>
            <p className="text-[10px] text-slate-400 font-semibold">{t('dash.workspaceHealthSub')}</p>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Checklist Templates */}
            <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="font-bold">{t('dash.activeTemplates')}</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white">{templates.length}</span>
            </div>

            {/* Total corrective action checklist progress */}
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">{t('dash.actionsSla')}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {Math.round((actions.filter(a => a.status === 'completed').length / (actions.length || 1)) * 100)}%
                </span>
              </div>
              <ProgressBar value={(actions.filter(a => a.status === 'completed').length / (actions.length || 1)) * 100} size="sm" />
            </div>

            {/* Quick tips box */}
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-slate-600 dark:text-slate-400 text-[10px] leading-relaxed flex gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-950 dark:text-white block mb-0.5">{t('dash.auditorTip')}</span>
                {t('dash.auditorTipBody')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
