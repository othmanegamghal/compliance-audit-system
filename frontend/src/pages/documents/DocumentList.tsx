import React, { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { documentsApi } from '../../api/documents';
import { projectsApi } from '../../api/projects';
import { apiErrorMessage } from '../../api/client';
import type { ReferenceDocument, Project } from '../../types';
import { FileText, Plus, Trash2, FileCheck2 } from 'lucide-react';

export const DocumentList: React.FC = () => {
  const { t } = useLocale();
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [version, setVersion] = useState('');
  const [type, setType] = useState('Norme');

  const canManage = currentUser?.role !== 'manager';

  const load = async () => {
    setLoading(true);
    try {
      const [docs, projs] = await Promise.all([documentsApi.list(), projectsApi.list()]);
      setDocuments(docs);
      setProjects(projs);
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to load documents.'), 'danger');
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
    if (!name || !projectId) {
      addToast(t('audit.allRequired'), 'danger');
      return;
    }
    try {
      const doc = await documentsApi.create({ name, projectId, version, type, path: `/docs/${name}` });
      setDocuments((prev) => [doc, ...prev]);
      setIsModalOpen(false);
      setName(''); setProjectId(''); setVersion('');
      addToast('Document added.', 'success');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to add document.'), 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await documentsApi.remove(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      addToast('Document deleted.', 'info');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to delete document.'), 'danger');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('doc.title')}</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('doc.subtitle')}</p>
        </div>
        {canManage && (
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition-all">
            <Plus className="h-4 w-4" />
            {t('doc.new')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">{t('doc.none')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((d) => {
            const proj = projects.find((p) => p.id === d.projectId);
            return (
              <div key={d.id} className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{d.name}</h3>
                      <span className="text-[9px] text-slate-400 font-semibold">{proj?.name || '—'}</span>
                    </div>
                  </div>
                  {canManage && (
                    <button onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-850/80">
                  <Badge variant="info" size="sm">{d.type || '—'}</Badge>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <FileCheck2 className="h-3.5 w-3.5" /> v{d.version || '1.0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('doc.new')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('doc.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('doc.project')}</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" required>
              <option value="">—</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('doc.type')}</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                <option>Norme</option>
                <option>Procédure</option>
                <option>Politique</option>
                <option>Guide</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('doc.version')}</label>
              <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
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
