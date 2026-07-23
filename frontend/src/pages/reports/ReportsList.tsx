import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useData } from '../../context/DataContext';
import { useLocale } from '../../context/LocaleContext';
import { reportsApi, statsApi } from '../../api/misc';
import { apiErrorMessage } from '../../api/client';
import type { Kpis } from '../../types';
import {
  FileText,
  FileSpreadsheet,
  FileDown,
  Calendar,
  Layers,
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

export const ReportsList: React.FC = () => {
  const { addToast } = useNotifications();
  const { audits, templates, departments } = useData();
  const { t, formatDate } = useLocale();

  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    statsApi.kpis().then(setKpis).catch(() => {});
  }, [audits]);

  const handlePdf = async (auditId: string) => {
    setDownloadingId(auditId);
    try {
      await reportsApi.auditPdf(auditId);
      addToast('PDF report downloaded.', 'success', 'Export Completed');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to generate PDF.'), 'danger');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCsv = async (kind: 'audits' | 'findings') => {
    try {
      if (kind === 'audits') await reportsApi.auditsCsv();
      else await reportsApi.findingsCsv();
      addToast('CSV exported.', 'success');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to export CSV.'), 'danger');
    }
  };

  const closedAudits = audits.filter((a) => a.status === 'closed');

  const kpiCards = [
    { label: t('dash.complianceScore'), value: kpis ? `${kpis.complianceRate}%` : '—', icon: TrendingUp, color: 'text-primary bg-blue-500/10' },
    { label: t('dash.auditsConducted'), value: kpis ? kpis.auditsClosed : '—', icon: ClipboardCheck, color: 'text-success bg-emerald-500/10' },
    { label: t('dash.openFindings'), value: kpis ? kpis.openFindings : '—', icon: AlertTriangle, color: 'text-warning bg-amber-500/10' },
    { label: t('risk.title'), value: kpis ? Object.values(kpis.risksByLevel).reduce((a, b) => a + b, 0) : '—', icon: ShieldAlert, color: 'text-danger bg-rose-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('rep.kpiTitle')}</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Export certified PDF reports and CSV datasets</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleCsv('audits')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-650 dark:text-slate-400 transition-all">
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            {t('rep.exportAuditsCsv')}
          </button>
          <button onClick={() => handleCsv('findings')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-650 dark:text-slate-400 transition-all">
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            {t('rep.exportFindingsCsv')}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">{c.value}</div>
              <span className="text-[10px] text-slate-400 font-semibold">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Risks by level + Actions by status */}
      {kpis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{t('rep.risksByLevel')}</h3>
            <div className="space-y-2">
              {Object.entries(kpis.risksByLevel).map(([lvl, n]) => (
                <div key={lvl} className="flex items-center gap-3 text-xs">
                  <span className="w-16 font-semibold capitalize text-slate-500">{t(`risk.level.${lvl}`)}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${lvl === 'critical' ? 'bg-rose-500' : lvl === 'high' ? 'bg-orange-400' : lvl === 'medium' ? 'bg-amber-300' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, n * 25)}%` }} />
                  </div>
                  <span className="w-6 text-right font-bold text-slate-800 dark:text-white">{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{t('rep.deptPerformance')}</h3>
            <div className="space-y-2">
              {kpis.departmentPerformance.map((d) => (
                <div key={d.name} className="flex items-center gap-3 text-xs">
                  <span className="w-28 truncate font-semibold text-slate-500">{d.name}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${d.compliance}%` }} />
                  </div>
                  <span className="w-9 text-right font-bold text-slate-800 dark:text-white">{d.compliance}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Closed audits with real PDF download */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {closedAudits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800 md:col-span-2">
            {t('audit.noAudits')}
          </div>
        ) : (
          closedAudits.map((a) => {
            const template = templates.find((tpl) => tpl.id === a.templateId);
            const department = departments.find((d) => d.id === a.departmentId);
            return (
              <div key={a.id} className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-primary dark:text-primary-light flex items-center justify-center flex-shrink-0">
                    <FileDown className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{a.name}</h3>
                    <span className="text-[9px] text-slate-400 font-semibold">{department?.name} · Score {a.score}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50 dark:border-slate-850/80 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1.5 font-semibold"><Calendar className="h-4 w-4 text-slate-400" />{formatDate(a.completedAt || a.createdAt)}</span>
                  <span className="flex items-center gap-1.5 font-semibold"><Layers className="h-4 w-4 text-slate-400" />{template?.name?.slice(0, 22) || '—'}</span>
                </div>
                <button
                  onClick={() => handlePdf(a.id)}
                  disabled={downloadingId === a.id}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60"
                >
                  {downloadingId === a.id ? (
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {t('rep.downloadPdf')}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
