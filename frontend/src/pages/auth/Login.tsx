import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLocale } from '../../context/LocaleContext';
import { apiErrorMessage } from '../../api/client';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Mail, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useNotifications();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast(t('auth.enterEmailPassword'), 'danger');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      addToast(t('auth.welcome'), 'success', t('auth.loginSuccess'));
      navigate('/');
    } catch (err) {
      addToast(apiErrorMessage(err, t('auth.failed')), 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('auth.signInTitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('auth.signInSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Address */}
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

        {/* Password */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">
              {t('auth.password')}
            </label>
            <Link
              to="/forgot-password"
              className="text-[10px] font-semibold text-primary dark:text-primary-light hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? t('auth.authenticating') : t('auth.signIn')}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="font-bold text-primary dark:text-primary-light hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </form>
    </div>
  );
};
