import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { can } from '../../auth/permissions';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { useNotifications } from '../../context/NotificationContext';
import {
  ClipboardList,
  Plus,
  Building,
  User,
  Play,
  Eye,
} from 'lucide-react';
import type { AuditStatus } from '../../types';

export const AuditList: React.FC = () => {
  const { audits, departments, templates, users, createAudit } = useData();
  const { currentUser } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const { addToast } = useNotifications();

  // Search/Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [auditName, setAuditName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const handleOpenCreateModal = () => {
    setAuditName('');
    setSelectedDeptId('');
    setSelectedTemplateId('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditName || !selectedDeptId || !selectedTemplateId) {
      addToast(t('audit.allRequired'), 'danger');
      return;
    }
    if (!currentUser) {
      addToast(t('audit.mustSignIn'), 'danger');
      return;
    }

    try {
      const newAudit = await createAudit({
        name: auditName,
        departmentId: selectedDeptId,
        templateId: selectedTemplateId,
        auditorId: currentUser.id,
        status: 'draft',
      });

      setIsCreateModalOpen(false);
      // Automatically redirect to execution page to start answering questions
      navigate(`/audits/${newAudit.id}/execute`);
    } catch (err) {
      addToast(t('audit.createFailed'), 'danger');
    }
  };

  // Filtered audits
  const filteredAudits = audits.filter((audit) => {
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;
    const matchesDept = deptFilter === 'all' || audit.departmentId === deptFilter;
    return matchesStatus && matchesDept;
  });

  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'closed':
        return <Badge variant="success" size="sm">{t('status.closed')}</Badge>;
      case 'in_progress':
        return <Badge variant="primary" size="sm">{t('status.in_progress')}</Badge>;
      case 'in_review':
        return <Badge variant="warning" size="sm">{t('status.in_review')}</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{t('status.draft')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('audit.title')}</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t('audit.subtitle')}</p>
        </div>
        {can(currentUser?.role, 'audits.create') && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            {t('dash.scheduleAudit')}
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Tab selectors */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {(['all', 'draft', 'in_progress', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-bold capitalize rounded-lg transition-all flex-shrink-0 ${
                statusFilter === status
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
              }`}
            >
              {status === 'all' ? t('status.allAudits') : status === 'draft' ? t('status.draft') : t(`status.${status}`)}
            </button>
          ))}
        </div>

        {/* Department Filter Selector */}
        <div className="w-full md:w-56">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t('audit.allDepartments')}</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audits Directory List */}
      <div className="space-y-4">
        {filteredAudits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">
            {t('audit.noAudits')}
          </div>
        ) : (
          filteredAudits.map((audit) => {
            const dept = departments.find((d) => d.id === audit.departmentId);
            const tpl = templates.find((t) => t.id === audit.templateId);
            const auditor = users.find((u) => u.id === audit.auditorId);
            
            // Calculate progress answering checklist questions
            const totalQuestionsCount = tpl?.questions.length || 1;
            const answersCount = audit.answers.filter(a => a.value !== null).length;
            const progressPct = Math.round((answersCount / totalQuestionsCount) * 100);

            return (
              <div
                key={audit.id}
                className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-slate-700 transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-6"
              >
                {/* Details Column */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {getStatusBadge(audit.status)}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {audit.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                      <Building className="h-4 w-4 text-slate-400" />
                      {dept?.name || t('audit.unknownDept')}
                    </span>
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                      <ClipboardList className="h-4 w-4 text-slate-400" />
                      {t('audit.template')}: {tpl?.name || t('audit.generalList')}
                    </span>
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                      <User className="h-4 w-4 text-slate-400" />
                      {t('audit.auditor')}: {auditor?.name || '—'}
                    </span>
                  </div>
                </div>

                {/* Performance score columns */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                  {/* Score or Answering progress bar */}
                  <div className="w-full sm:w-44 space-y-1 text-xs">
                    {audit.status === 'closed' ? (
                      <>
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">{t('dash.complianceScore')}</span>
                          <span className={`font-bold ${audit.score >= 80 ? 'text-success' : audit.score >= 50 ? 'text-warning' : 'text-danger'}`}>
                            {audit.score}%
                          </span>
                        </div>
                        <ProgressBar value={audit.score} size="sm" />
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">{t('audit.questionsAnswered')}</span>
                          <span className="font-bold text-slate-800 dark:text-white">{progressPct}%</span>
                        </div>
                        <ProgressBar value={progressPct} size="sm" />
                      </>
                    )}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/audits/${audit.id}`)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <Eye className="h-4 w-4" />
                      {t('audit.details')}
                    </button>

                    {audit.status !== 'closed' && can(currentUser?.role, 'audits.execute') && (
                      <button
                        onClick={() => navigate(`/audits/${audit.id}/execute`)}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm transition-all"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        {audit.status === 'draft' ? t('audit.start') : t('audit.resume')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SCHEDULE AUDIT MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={t('audit.scheduleModalTitle')}>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('audit.name')}</label>
            <input
              type="text"
              placeholder={t('audit.namePlaceholder')}
              value={auditName}
              onChange={(e) => setAuditName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('audit.selectDept')}</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">{t('audit.chooseDept')}</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{t('audit.selectTemplate')}</label>
            <div className="relative">
              <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">{t('audit.chooseTemplate')}</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.questions.length} {t('audit.questionsSuffix')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              {t('audit.initialize')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
