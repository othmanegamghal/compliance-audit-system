import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLocale } from '../../context/LocaleContext';
import { PasswordInput } from '../../components/ui/PasswordInput';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useNotifications();
  const { t } = useLocale();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast(t('auth.passwordsNoMatch'), 'danger');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      addToast(t('auth.passwordUpdated'), 'success');
    } catch (err) {
      addToast(t('auth.resetError'), 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('auth.resetHeading')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('auth.resetDesc')}
        </p>
      </div>

      {success ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/35 p-5 rounded-2xl text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('auth.passwordUpdatedTitle')}</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal">
              {t('auth.passwordUpdatedDesc')}
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 text-xs shadow-md transition-all"
          >
            {t('auth.goToSignIn')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">
              {t('auth.newPassword')}
            </label>
            <PasswordInput value={password} onChange={setPassword} placeholder={t('auth.min8')} required autoComplete="new-password" />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">
              {t('auth.confirmNewPassword')}
            </label>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder={t('auth.reenter')} required autoComplete="new-password" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 text-xs shadow-md transition-all disabled:opacity-50 mt-2"
          >
            {loading ? t('auth.updatingPassword') : t('auth.updatePassword')}
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
