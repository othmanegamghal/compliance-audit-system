import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useLocale } from '../context/LocaleContext';
import { canView } from '../auth/permissions';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { ToastContainer } from '../components/ui/ToastContainer';
import {
  ShieldCheck,
  ShieldAlert,
  LayoutDashboard,
  ClipboardList,
  FolderLock,
  FolderKanban,
  FileWarning,
  FileText,
  History,
  Kanban,
  Users,
  Building2,
  FileBarChart2,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { t, formatTime } = useLocale();

  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.audits'), href: '/audits', icon: ClipboardList },
    { name: t('nav.templates'), href: '/templates', icon: FolderLock },
    { name: t('nav.findings'), href: '/findings', icon: FileWarning },
    { name: t('nav.actions'), href: '/actions', icon: Kanban },
    { name: t('nav.risks'), href: '/risks', icon: ShieldAlert },
    { name: t('nav.projects'), href: '/projects', icon: FolderKanban },
    { name: t('nav.documents'), href: '/documents', icon: FileText },
    { name: t('nav.users'), href: '/users', icon: Users },
    { name: t('nav.departments'), href: '/departments', icon: Building2 },
    { name: t('nav.history'), href: '/history', icon: History },
    { name: t('nav.reports'), href: '/reports', icon: FileBarChart2 },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  // Filters navigation based on the role's view access (see auth/permissions).
  const filteredNavigation = navigation.filter((item) => canView(currentUser?.role, item.href));

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    
    if (parts.length === 0) return [];
    
    const navKeyByPath: Record<string, string> = {
      audits: 'nav.audits',
      templates: 'nav.templates',
      findings: 'nav.findings',
      actions: 'nav.actions',
      users: 'nav.users',
      departments: 'nav.departments',
      reports: 'nav.reports',
      settings: 'nav.settings',
    };

    return parts.map((part, index) => {
      const url = `/${parts.slice(0, index + 1).join('/')}`;
      // Clean display label
      let label = part.charAt(0).toUpperCase() + part.slice(1);
      if (navKeyByPath[part]) label = t(navKeyByPath[part]);

      // Check for standard sub-labels (numeric or prefixed ids)
      if (/^\d+$/.test(part) || part.startsWith('a-')) label = t('nav.audits');

      return {
        label,
        path: index === parts.length - 1 ? undefined : url,
      };
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadNotifs = notifications.filter(n => !n.read);

  const getRoleLabel = (role: string) => t(`role.${role}`);


  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-darkbg text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <ToastContainer />

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR PANEL */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-darkbg-card border-r border-slate-200/60 dark:border-slate-800 transform lg:translate-x-0 transition-transform duration-200 ease-out flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-0.5 lg:-translate-x-0 hidden lg:flex'}`}>
        <div>
          {/* Sidebar Brand Header */}
          <div className="h-16 px-6 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center shadow-md">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-950 dark:text-white block">Compliance.io</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block -mt-1 font-semibold uppercase tracking-wider">{t('nav.brandTagline')}</span>
              </div>
            </Link>
            <button 
              className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="p-4 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20 dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Signed-in user card */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/10">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
          >
            <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200/70 dark:border-slate-700 bg-slate-100 flex-shrink-0">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight block truncate">
                {currentUser?.name ?? 'Guest'}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold block">
                {currentUser ? getRoleLabel(currentUser.role) : ''}
              </span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('top.signOut')}
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        
        {/* TOP NAVBAR */}
        <header className="h-16 border-b border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-darkbg-card/75 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <div className="hidden sm:block">
              <Breadcrumb items={getBreadcrumbs()} />
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t('top.searchPlaceholder')}
                className="pl-9 pr-4 py-1.5 w-60 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-primary-light"
              />
            </div>

            {/* Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notification Center Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {notifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-darkbg-card rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-800/85 z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
                      <span className="font-bold text-xs text-slate-800 dark:text-white">{t('top.notifications')}</span>
                      {unreadNotifs.length > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-[10px] font-semibold text-primary dark:text-primary-light hover:underline"
                        >
                          {t('top.markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          {t('top.noNotifications')}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              markAsRead(n.id);
                              setNotifDropdownOpen(false);
                            }}
                            className={`p-3.5 text-xs text-left cursor-pointer transition-colors ${!n.read ? 'bg-primary/5 dark:bg-blue-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`font-bold text-slate-800 dark:text-slate-100 ${!n.read ? 'text-primary dark:text-primary-light' : ''}`}>
                                {n.title}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {formatTime(n.date)}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 focus:outline-none"
              >
                <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-slate-100 flex-shrink-0">
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser?.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                    {currentUser?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                    {currentUser ? getRoleLabel(currentUser.role) : ''}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden lg:block" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-darkbg-card rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-800/85 z-50 p-1 flex flex-col gap-0.5">
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-950 dark:text-white block truncate">{currentUser?.name}</span>
                      <span className="text-[9px] text-slate-400 truncate block">{currentUser?.email}</span>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Settings className="h-4 w-4" />
                      {t('top.accountSettings')}
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-800/50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('top.signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
