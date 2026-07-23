import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLocale } from '../../context/LocaleContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { risksApi } from '../../api/risks';
import { apiErrorMessage } from '../../api/client';
import type { Risk, RiskLevel } from '../../types';
import { Plus, Trash2, Gauge } from 'lucide-react';

const LEVEL_VARIANT: Record<RiskLevel, 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

export const RiskList: React.FC = () => {
  const { findings } = useData();
  const { t } = useLocale();
  const { addToast } = useNotifications();

  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [nonConformityId, setNonConformityId] = useState('');
  const [name, setName] = useState('');
  const [impact, setImpact] = useState(3);
  const [probability, setProbability] = useState(3);

  const load = async () => {
    setLoading(true);
    try {
      setRisks(await risksApi.list());
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to load risks.'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nonConformityId || !name) {
      addToast(t('audit.allRequired'), 'danger');
      return;
    }
    try {
      const risk = await risksApi.create({ nonConformityId, name, impact, probability });
      setRisks((prev) => [risk, ...prev]);
      setIsModalOpen(false);
      setName(''); setNonConformityId(''); setImpact(3); setProbability(3);
      addToast('Risk assessed and recorded.', 'success');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to create risk.'), 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await risksApi.remove(id);
      setRisks((prev) => prev.filter((r) => r.id !== id));
      addToast('Risk deleted.', 'info');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to delete risk.'), 'danger');
    }
  };

  const counts: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  risks.forEach((r) => { counts[r.level] += 1; });

  const cellColor = (crit: number) =>
    crit >= 15 ? 'bg-rose-500 text-white' : crit >= 9 ? 'bg-orange-400 text-white' : crit >= 4 ? 'bg-amber-300 text-amber-900' : 'bg-emerald-300 text-emerald-900';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('risk.title')}</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('risk.subtitle')}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition-all">
          <Plus className="h-4 w-4" />
          {t('risk.new')}
        </button>
      </div>

      {/* Criticality summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map((lvl) => (
          <div key={lvl} className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t(`risk.level.${lvl}`)}</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{counts[lvl]}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : risks.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">{t('risk.none')}</div>
      ) : (
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400">
              <tr className="text-left">
                <th className="px-5 py-3 font-bold">{t('risk.name')}</th>
                <th className="px-5 py-3 font-bold">{t('risk.impact')}</th>
                <th className="px-5 py-3 font-bold">{t('risk.probability')}</th>
                <th className="px-5 py-3 font-bold">{t('risk.criticality')}</th>
                <th className="px-5 py-3 font-bold">{t('risk.level')}</th>
                <th className="px-5 py-3 font-bold text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {risks.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">{r.name}</td>
                  <td className="px-5 py-3">{r.impact}</td>
                  <td className="px-5 py-3">{r.probability}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center justify-center h-6 w-8 rounded-lg font-bold ${cellColor(r.criticality)}`}>{r.criticality}</span>
                  </td>
                  <td className="px-5 py-3"><Badge variant={LEVEL_VARIANT[r.level]} size="sm">{t(`risk.level.${r.level}`)}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/5">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('risk.new')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('risk.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('risk.linkedFinding')}</label>
            <select value={nonConformityId} onChange={(e) => setNonConformityId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" required>
              <option value="">—</option>
              {findings.map((f) => <option key={f.id} value={f.id}>{f.description.slice(0, 60)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('risk.impact')} (1-5)</label>
              <input type="number" min={1} max={5} value={impact} onChange={(e) => setImpact(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('risk.probability')} (1-5)</label>
              <input type="number" min={1} max={5} value={probability} onChange={(e) => setProbability(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Gauge className="h-4 w-4 text-primary" />
            {t('risk.criticality')}: <span className="font-extrabold">{impact * probability}</span>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">{t('common.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl shadow-sm">{t('common.create')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
