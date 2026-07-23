import React, { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useNotifications } from '../../context/NotificationContext';
import { historyApi } from '../../api/misc';
import { apiErrorMessage } from '../../api/client';
import type { HistoryEntry } from '../../types';
import { History, Clock } from 'lucide-react';

export const HistoryList: React.FC = () => {
  const { t, formatDate, formatTime } = useLocale();
  const { addToast } = useNotifications();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyApi
      .list()
      .then(setEntries)
      .catch((err) => addToast(apiErrorMessage(err, 'Failed to load history.'), 'danger'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-slate-400" />
          {t('hist.title')}
        </h2>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('hist.subtitle')}</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">{t('hist.none')}</div>
      ) : (
        <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {entries.map((h) => (
            <div key={h.id} className="p-4 flex items-start gap-3 text-xs">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-slate-950 dark:text-white">{h.userName}</span>{' '}
                  <span className="font-semibold text-primary dark:text-primary-light">{h.action}</span>
                  {h.description ? ` — ${h.description}` : ''}
                </p>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {formatDate(h.date)} · {formatTime(h.date)}{h.ip ? ` · ${h.ip}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
