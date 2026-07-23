import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useData } from '../../context/DataContext';
import { useLocale } from '../../context/LocaleContext';
import { Badge } from '../../components/ui/Badge';
import { uploadsApi } from '../../api/uploads';
import { apiErrorMessage } from '../../api/client';
import type { Lang } from '../../i18n/translations';
import {
  User,
  Bell,
  Palette,
  Save,
  Globe,
  Camera,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { editUser } = useData();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useNotifications();
  const { t, language: activeLanguage, timezone: activeTimezone, setLocale } = useLocale();

  // Local state for settings form
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState<Lang>(activeLanguage);
  const [timezone, setTimezone] = useState(activeTimezone);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Notifications checkboxes
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [reportDigest, setReportDigest] = useState(false);

  const handlePhotoSelected = async (file: File) => {
    if (!currentUser) return;
    setUploadingPhoto(true);
    try {
      const result = await uploadsApi.upload(file);
      setAvatar(result.url);
      await editUser(currentUser.id, { avatar: result.url });
      setCurrentUser({ ...currentUser, avatar: result.url });
      addToast(t('settings.photoUpdated'), 'success');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to upload profile photo.'), 'danger');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      await editUser(currentUser.id, { name, email, avatar });
      setCurrentUser({ ...currentUser, name, email, avatar });
      addToast(t('settings.profileSaved'), 'success');
    }
  };

  const handleSaveLocalization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingPrefs(true);
    try {
      // Apply immediately (whole UI switches) and persist to the profile.
      setLocale(language, timezone);
      await editUser(currentUser.id, { language, timezone });
      setCurrentUser({ ...currentUser, language, timezone });
      addToast(t('settings.preferencesSaved'), 'success');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to save preferences.'), 'danger');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    addToast(t('settings.notifPrefsSaved'), 'success');
  };

  const roleLabel = currentUser ? t(`role.${currentUser.role}`) : t('common.none');

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.title')}</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User details */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile Form */}
          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-slate-400" />
              {t('settings.personalProfile')}
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile photo */}
              <div className="flex items-center gap-4 pb-2">
                <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 flex-shrink-0">
                  <img
                    src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('settings.profilePhoto')}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoSelected(file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-650 dark:text-slate-400 transition-all disabled:opacity-60"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {uploadingPhoto ? t('settings.uploading') : t('settings.changePhoto')}
                  </button>
                  <p className="text-[9px] text-slate-400 font-semibold">{t('settings.photoHint')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('settings.fullName')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white dark:focus:bg-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('common.email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white dark:focus:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {t('common.saveChanges')}
                </button>
              </div>
            </form>
          </div>

          {/* Preferences and Localization */}
          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-slate-400" />
              {t('settings.localization')}
            </h3>

            <form onSubmit={handleSaveLocalization} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('settings.language')}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Lang)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1"
                  >
                    <option value="en">English (US)</option>
                    <option value="fr">Français (French)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('settings.timezone')}</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1"
                  >
                    <option value="utc-8">PST (UTC -8)</option>
                    <option value="utc-5">EST (UTC -5)</option>
                    <option value="utc+0">GMT (UTC +0)</option>
                    <option value="utc+1">CET (UTC +1)</option>
                    <option value="utc+2">EET (UTC +2)</option>
                    <option value="utc+3">MSK (UTC +3)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {savingPrefs ? t('settings.uploading') : t('settings.savePreferences')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Theme & Notifications config */}
        <div className="space-y-6">
          {/* Visual theme selector */}
          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Palette className="h-4.5 w-4.5 text-slate-400" />
              {t('settings.themeCustomization')}
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-650 dark:text-slate-350">{t('settings.displayMode')}</span>
                <button
                  onClick={toggleTheme}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold uppercase tracking-wider transition-colors"
                >
                  {t('settings.toggleTo', { mode: theme === 'light' ? t('settings.dark') : t('settings.light') })}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-650 dark:text-slate-350">{t('settings.defaultFont')}</span>
                <Badge variant="neutral">Inter (Google Fonts)</Badge>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-650 dark:text-slate-350">{t('settings.accessLevel')}</span>
                <Badge variant="primary" className="uppercase tracking-wider">
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Notifications toggles */}
          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-slate-400" />
              {t('settings.notificationSettings')}
            </h3>

            <form onSubmit={handleSaveNotifications} className="space-y-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-200 dark:border-slate-800 text-primary focus:ring-0 cursor-pointer"
                  />
                  {t('settings.emailAlerts')}
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-200 dark:border-slate-800 text-primary focus:ring-0 cursor-pointer"
                  />
                  {t('settings.pushAlerts')}
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportDigest}
                    onChange={(e) => setReportDigest(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-200 dark:border-slate-800 text-primary focus:ring-0 cursor-pointer"
                  />
                  {t('settings.reportDigest')}
                </label>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-850 dark:text-white rounded-xl text-xs font-bold transition-all"
                >
                  {t('settings.savePreferences')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
