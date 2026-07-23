import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { projectsApi } from '../../api/projects';
import { apiErrorMessage } from '../../api/client';
import type { Project } from '../../types';
import { FolderKanban, Plus, Building, Trash2, Target, DollarSign, Calendar } from 'lucide-react';

export const ProjectList: React.FC = () => {
  const { departments } = useData();
  const { t, formatDate } = useLocale();
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'direction';

  const load = async () => {
    setLoading(true);
    try {
      setProjects(await projectsApi.list());
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to load projects.'), 'danger');
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
    if (!name || !departmentId) {
      addToast(t('audit.allRequired'), 'danger');
      return;
    }
    try {
      const project = await projectsApi.create({
        name,
        departmentId,
        description,
        budget: budget ? Number(budget) : undefined,
        priority,
        startDate: startDate || undefined,
        status: 'in_progress',
      });
      setProjects((prev) => [project, ...prev]);
      setIsModalOpen(false);
      setName(''); setDepartmentId(''); setBudget(''); setStartDate(''); setDescription('');
      addToast(`Project "${project.name}" created.`, 'success');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to create project.'), 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('proj.deleteConfirm'))) return;
    try {
      await projectsApi.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      addToast('Project deleted.', 'info');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to delete project.'), 'danger');
    }
  };

  const priorityVariant = (p?: string) => (p === 'high' ? 'danger' : p === 'low' ? 'neutral' : 'warning');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('proj.title')}</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('proj.subtitle')}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            {t('proj.new')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">
          {t('proj.none')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => {
            const dept = departments.find((d) => d.id === p.departmentId);
            return (
              <div key={p.id} className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-primary dark:text-primary-light flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{p.name}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Building className="h-3 w-3" /> {dept?.name || '—'}
                      </span>
                    </div>
                  </div>
                  <Badge variant={priorityVariant(p.priority)} size="sm" className="capitalize">{p.priority}</Badge>
                </div>

                {p.description && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.description}</p>}

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-50 dark:border-slate-850/80 text-[10px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-slate-400" />{p.budget ? p.budget.toLocaleString() : '—'}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" />{p.startDate ? formatDate(p.startDate) : '—'}</span>
                  <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5 text-slate-400" />{p.objectivesCount} {t('proj.objectives')}</span>
                </div>

                {canManage && (
                  <div className="flex justify-end pt-1">
                    <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/5">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('proj.new')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('proj.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('common.department')}</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" required>
              <option value="">{t('audit.chooseDept')}</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('proj.budget')}</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('proj.priority')}</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('proj.startDate')}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('common.name')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
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
