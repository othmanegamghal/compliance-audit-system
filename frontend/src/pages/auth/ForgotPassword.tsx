import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLocale } from '../../context/LocaleContext';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotifications();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // Simulate sending email
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
      addToast(t('auth.resetSent'), 'success');
    } catch (err) {
      addToast(t('auth.resetSendError'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('auth.forgotHeading')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('auth.forgotDesc')}
        </p>
      </div>

      {submitted ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/35 p-5 rounded-2xl text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Mail className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('auth.checkEmail')}</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal">
              {t('auth.sentLinkTo', { email }).split('{email}')[0]}
              <span className="font-semibold text-slate-700 dark:text-slate-350">{email}</span>.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-light hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('auth.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">
              {t('common.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 text-xs shadow-md transition-all disabled:opacity-50 mt-2"
          >
            {loading ? t('auth.sendingLink') : t('auth.sendResetLink')}
            {!loading && <Send className="h-3.5 w-3.5" />}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
