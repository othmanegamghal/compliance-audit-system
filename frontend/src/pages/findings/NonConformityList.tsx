import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { can } from '../../auth/permissions';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { useNotifications } from '../../context/NotificationContext';
import { aiApi } from '../../api/ai';
import { apiErrorMessage } from '../../api/client';
import { Sparkles } from 'lucide-react';
import {
  FileWarning,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  FileCheck,
} from 'lucide-react';
import type { NonConformityStatus, SeverityLevel } from '../../types';

export const NonConformityList: React.FC = () => {
  const { findings, audits, users, updateFindingStatus, departments } = useData();
  const { currentUser } = useAuth();
  const { t } = useLocale();
  const { addToast } = useNotifications();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Drawer details State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Corrective action assignment form state
  const [correctiveActionText, setCorrectiveActionText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const handleSuggestAction = async () => {
    if (!selectedFindingId) return;
    setAiSuggesting(true);
    try {
      const s = await aiApi.suggestAction(selectedFindingId);
      setCorrectiveActionText(s.action);
      setDueDate(s.dueDate);
      addToast(t('aisug.done'), 'success');
    } catch (err) {
      addToast(apiErrorMessage(err, t('ai.failed')), 'danger');
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleOpenDetails = (findingId: string) => {
    const finding = findings.find((f) => f.id === findingId);
    if (!finding) return;

    setSelectedFindingId(findingId);
    setCorrectiveActionText(finding.correctiveActionText || '');
    setDueDate(finding.correctiveActionDueDate || '');
    setIsDrawerOpen(true);
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFindingId) return;

    if (!correctiveActionText || !dueDate) {
      addToast('Please describe the corrective action and assign a due date.', 'danger');
      return;
    }

    // Set finding status to action_pending, which automatically creates the corrective action card in Kanban
    updateFindingStatus(selectedFindingId, 'action_pending', correctiveActionText, dueDate);
    addToast('Corrective action assigned. Status updated to Action Pending.', 'success');
  };

  const handleResolveFinding = () => {
    if (!selectedFindingId) return;
    updateFindingStatus(selectedFindingId, 'resolved');
    addToast('Non-Conformity successfully verified and resolved.', 'success');
  };

  // Filtered findings
  const filteredFindings = findings.filter((finding) => {
    const audit = audits.find((a) => a.id === finding.auditId);
    const dept = audit ? departments.find((d) => d.id === audit.departmentId) : null;
    
    const matchesSearch =
      finding.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === 'all' || finding.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || finding.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (level: SeverityLevel) => {
    switch (level) {
      case 'critical':
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case 'high':
        return <Badge variant="danger" size="sm">High</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium</Badge>;
      default:
        return <Badge variant="primary" size="sm">Low</Badge>;
    }
  };

  const getStatusBadge = (status: NonConformityStatus) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'action_completed':
        return <Badge variant="info" size="sm">Action Completed</Badge>;
      case 'action_pending':
        return <Badge variant="warning" size="sm">Action Pending</Badge>;
      default:
        return <Badge variant="danger" size="sm">Open</Badge>;
    }
  };

  const activeFinding = findings.find((f) => f.id === selectedFindingId);
  const activeAudit = activeFinding ? audits.find((a) => a.id === activeFinding.auditId) : null;
  const activeDept = activeAudit ? departments.find((d) => d.id === activeAudit.departmentId) : null;
  const activeManager = activeFinding ? users.find((u) => u.id === activeFinding.assignedTo) : null;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Non-Conformities (Findings)</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Track, assign, and validate corrective actions raised during compliance assessments</p>
        </div>
      </div>

      {/* Filters Dashboard Toolbar */}
      <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search descriptions, finding IDs, depts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <Filter className="h-3.5 w-3.5" />
            Filters:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-750 dark:text-slate-200 focus:outline-none focus:ring-1"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open (Unassigned)</option>
            <option value="action_pending">Action Pending</option>
            <option value="action_completed">Action Completed</option>
            <option value="resolved">Resolved (Closed)</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-750 dark:text-slate-200 focus:outline-none focus:ring-1"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Findings Data Table */}
      <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/35 border-b border-slate-200/60 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Finding ID</th>
                <th className="px-6 py-4">Associated Scope / Department</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-450 italic">
                    No non-conformity findings recorded.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((finding) => {
                  const audit = audits.find((a) => a.id === finding.auditId);
                  const dept = audit ? departments.find((d) => d.id === audit.departmentId) : null;

                  return (
                    <tr key={finding.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase">
                        {finding.id}
                      </td>
                      <td className="px-6 py-4 space-y-0.5">
                        <span className="font-semibold block">{dept?.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium block">{audit?.name}</span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-650 dark:text-slate-350">
                        {finding.description}
                      </td>
                      <td className="px-6 py-4">{getSeverityBadge(finding.severity)}</td>
                      <td className="px-6 py-4">{getStatusBadge(finding.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(finding.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FINDING SLIDER DRAWER PANEL */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Finding Details: ${activeFinding?.id.toUpperCase()}`}
      >
        {activeFinding && (
          <div className="space-y-6">
            {/* Summary Details */}
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-450 block font-bold">Severity Rating</span>
                {getSeverityBadge(activeFinding.severity)}
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-450 block font-bold">Current Status</span>
                {getStatusBadge(activeFinding.status)}
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-450 block font-bold">Target Department</span>
                <span className="font-semibold">{activeDept?.name} ({activeDept?.code})</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-450 block font-bold">Assigned Owner (Dept Manager)</span>
                <span className="font-semibold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {activeManager?.name}
                </span>
              </div>
            </div>

            {/* Gap Description text block */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100/60 dark:border-slate-800 space-y-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileWarning className="h-4.5 w-4.5 text-slate-400" />
                Gap Statement / Description
              </span>
              <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                {activeFinding.description}
              </p>
            </div>

            {/* Sub-workflow 1: If open, show correct assignment Form (for manager/auditors) */}
            {activeFinding.status === 'open' && can(currentUser?.role, 'findings.manage') && (
              <form onSubmit={handleSaveAction} className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Assign Corrective Actions
                  </h4>
                  <button
                    type="button"
                    onClick={handleSuggestAction}
                    disabled={aiSuggesting}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 hover:opacity-90 text-white text-[10px] font-bold shadow-sm transition-all disabled:opacity-60"
                  >
                    {aiSuggesting ? (
                      <span className="h-3 w-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {aiSuggesting ? t('aisug.loading') : t('aisug.button')}
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                    Action Plan Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe specific actions needed to remediate this gap (e.g. run scripts, deploy policies, draft documents)..."
                    value={correctiveActionText}
                    onChange={(e) => setCorrectiveActionText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                    Resolution Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  Confirm Assignment
                </button>
              </form>
            )}

            {/* Sub-workflow 2: If corrective actions assigned, display them */}
            {activeFinding.status !== 'open' && (
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Remediation Action Plan
                </h4>
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-2">
                  <p className="text-slate-700 dark:text-slate-350 leading-normal font-semibold">
                    {activeFinding.correctiveActionText}
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold uppercase tracking-wider pt-2 border-t border-slate-150/60 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Due: {activeFinding.correctiveActionDueDate}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-workflow 3: If completed, show auditor validation button (only for lead auditors) */}
            {activeFinding.status === 'action_completed' && currentUser?.role === 'auditor' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Auditor Verification Panel
                </h4>
                <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                  Remediation tasks have been completed by the manager. Inspect evidence reports and logs before confirming resolution below.
                </p>
                <button
                  type="button"
                  onClick={handleResolveFinding}
                  className="w-full py-2.5 bg-success hover:bg-success-dark text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="h-4.5 w-4.5" />
                  Validate & Resolve Finding
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
