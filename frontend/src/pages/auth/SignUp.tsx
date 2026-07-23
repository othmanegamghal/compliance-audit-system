import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLocale } from '../../context/LocaleContext';
import { authApi, type RegisterOptions } from '../../api/auth';
import { apiErrorMessage } from '../../api/client';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { User, Mail, ArrowRight, Shield, Building } from 'lucide-react';

export const SignUp: React.FC = () => {
  const { applySession } = useAuth();
  const { addToast } = useNotifications();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('auditor');
  const [departmentId, setDepartmentId] = useState('');
  const [options, setOptions] = useState<RegisterOptions>({ departments: [], roles: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi
      .registerOptions()
      .then((opts) => {
        setOptions(opts);
        if (opts.roles.length) setRole(opts.roles[0]);
        if (opts.departments.length) setDepartmentId(opts.departments[0].id);
      })
      .catch(() => {});
  }, []);

  const roleLabel = (r: string) => (r === 'auditor' ? t('role.auditor') : t('role.manager'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !departmentId) {
      addToast(t('auth.registerFailed'), 'danger');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password, role, departmentId });
      applySession(res.access_token, res.user);
      addToast(t('auth.welcomeNew'), 'success');
      navigate('/');
    } catch (err) {
      addToast(apiErrorMessage(err, t('auth.registerFailed')), 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('auth.signUpTitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('auth.signUpSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('auth.fullName')}</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('common.email')}</label>
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

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('auth.password')}</label>
          <PasswordInput value={password} onChange={setPassword} placeholder={t('auth.min8')} required autoComplete="new-password" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('common.role')}</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {options.roles.map((r) => (
                  <option key={r} value={r}>{roleLabel(r)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('common.department')}</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                {options.departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? t('auth.creating') : t('auth.signUp')}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-bold text-primary dark:text-primary-light hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </form>
    </div>
  );
};
