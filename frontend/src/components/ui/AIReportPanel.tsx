import React, { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { can } from '../../auth/permissions';
import { aiReportApi, type AIReport } from '../../api/aiReport';
import { apiErrorMessage } from '../../api/client';
import { Sparkles, AlertCircle, CheckCircle2, Lightbulb, FileText } from 'lucide-react';

interface AIReportPanelProps {
  auditId: string;
  auditClosed: boolean;
}

export const AIReportPanel: React.FC<AIReportPanelProps> = ({ auditId, auditClosed }) => {
  const { t, formatDate } = useLocale();
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Auditors (and admin/direction) can trigger generation; managers view only.
  const canGenerate = can(currentUser?.role, 'audits.execute') || currentUser?.role === 'admin' || currentUser?.role === 'direction';

  useEffect(() => {
    aiReportApi
      .get(auditId)
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auditId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await aiReportApi.generate(auditId);
      setReport(result);
      addToast(t('ai.done'), 'success', t('ai.title'));
    } catch (err) {
      addToast(apiErrorMessage(err, t('ai.failed')), 'danger', t('ai.title'));
    } finally {
      setGenerating(false);
    }
  };

  const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );

  return (
    <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{t('ai.title')}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('ai.subtitle')}</p>
          </div>
        </div>
        {canGenerate && auditClosed && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60 flex-shrink-0"
          >
            {generating ? (
              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? t('ai.generating') : report ? t('ai.regenerate') : t('ai.generate')}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-4 text-center">{t('common.loading')}</p>
      ) : !report ? (
        <p className="text-xs text-slate-400 py-6 text-center leading-relaxed max-w-md mx-auto">{t('ai.empty')}</p>
      ) : (
        <div className="space-y-5">
          <Section icon={<FileText className="h-3.5 w-3.5 text-primary" />} title={t('ai.executiveSummary')}>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{report.executiveSummary}</p>
          </Section>

          <Section icon={<AlertCircle className="h-3.5 w-3.5 text-amber-500" />} title={t('ai.majorFindings')}>
            <ul className="space-y-1.5">
              {report.majorFindings.map((f, i) => (
                <li key={i} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex gap-2">
                  <span className="text-amber-500 flex-shrink-0">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<Lightbulb className="h-3.5 w-3.5 text-emerald-500" />} title={t('ai.recommendations')}>
            <ul className="space-y-1.5">
              {report.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<FileText className="h-3.5 w-3.5 text-slate-400" />} title={t('ai.conclusion')}>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{report.conclusion}</p>
          </Section>

          <div className="pt-2 border-t border-slate-50 dark:border-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
            <span>{t('ai.generatedBy', { model: report.model })}</span>
            <span>{formatDate(report.generatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
