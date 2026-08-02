import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Tabs } from '../../components/ui/Tabs';
import { CommentsPanel } from '../../components/ui/CommentsPanel';
import { AIReportPanel } from '../../components/ui/AIReportPanel';
import { useNotifications } from '../../context/NotificationContext';
import {
  ArrowLeft,
  Building,
  User,
  Calendar,
  ShieldCheck,
  AlertCircle,
  FileText,
  MessageSquare,
  History,
  FileIcon,
  Download,
  ExternalLink,
} from 'lucide-react';

export const AuditDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { audits, departments, templates, users, findings } = useData();
  const { addToast } = useNotifications();

  const [activeTab, setActiveTab] = useState('overview');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { id: 'c-1', user: 'Marcus Wright', text: 'Checked BitLocker logs. IT laptops are compliant except 3 dev units.', date: '2026-06-15T11:00:00Z' },
    { id: 'c-2', user: 'Sarah Connor', text: 'Please ensure that the dev team fixes this ASAP, as a security patch check is coming up next week.', date: '2026-06-15T12:30:00Z' },
  ]);

  const audit = audits.find((a) => a.id === id);
  if (!audit) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">
        Audit not found.
      </div>
    );
  }

  const dept = departments.find((d) => d.id === audit.departmentId);
  const tpl = templates.find((t) => t.id === audit.templateId);
  const auditor = users.find((u) => u.id === audit.auditorId);
  
  // Findings raised in this audit
  const auditFindings = findings.filter((f) => f.auditId === audit.id);

  // Evidence files gathered
  const evidenceAnswers = audit.answers.filter((ans) => ans.evidenceFileName);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      user: 'Sarah Connor', // admin persona
      text: commentText,
      date: new Date().toISOString(),
    };

    setComments([...comments, newComment]);
    setCommentText('');
    addToast('Comment added to audit trail.', 'success');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'closed':
        return <Badge variant="success">Closed</Badge>;
      case 'in_progress':
        return <Badge variant="primary">In Progress</Badge>;
      case 'in_review':
        return <Badge variant="warning">Under Review</Badge>;
      default:
        return <Badge variant="neutral">Scheduled</Badge>;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Audit Overview', icon: ShieldCheck },
    { id: 'checklist', label: 'Checklist Answers', icon: FileText },
    { id: 'findings', label: `Findings (${auditFindings.length})`, icon: AlertCircle },
    { id: 'timeline', label: 'Audit Timeline', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/audits')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {audit.name}
              </h2>
              {getStatusBadge(audit.status)}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">ID: {audit.id}</span>
          </div>
        </div>

        {/* Action execution shortcuts */}
        {audit.status !== 'closed' && (
          <button
            onClick={() => navigate(`/audits/${audit.id}/execute`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all"
          >
            Go to Execution Sheet
          </button>
        )}
      </div>

      {/* Tabs list */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Column: Information & Evidence */}
            <div className="lg:col-span-2 space-y-6">
              {/* Core Audit info */}
              <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-2">
                  General Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Department in Scope</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400" />
                      {dept?.name} ({dept?.code})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Lead Auditor</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {auditor?.name} ({auditor?.email})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Checklist Framework</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      {tpl?.name}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Date of Audit</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-2">
                  Uploaded Evidence Files ({evidenceAnswers.length})
                </h3>
                {evidenceAnswers.length === 0 ? (
                  <p className="text-xs text-slate-450 italic p-2">No evidence uploaded during this audit.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                    {evidenceAnswers.map((ans) => (
                      <div
                        key={ans.questionId}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-primary dark:text-primary-light flex-shrink-0">
                            <FileIcon className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">
                              {ans.evidenceFileName}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-medium mt-0.5 truncate max-w-[150px]">
                              Control ID: {ans.questionId}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 flex-shrink-0">
                          <a
                            href={ans.evidenceUrl}
                            download
                            className="p-1.5 text-slate-450 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Download Evidence"
                            onClick={(e) => { e.preventDefault(); addToast('Evidence download initialized.', 'info'); }}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Score progress & Comments Feed */}
            <div className="space-y-6">
              {/* Score card */}
              <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm text-center space-y-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Compliance Score
                </span>
                
                <div className="relative inline-flex items-center justify-center p-3 rounded-full bg-blue-500/5 ring-1 ring-blue-500/10">
                  <div className="h-28 w-28 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center flex-col">
                    <span className={`text-3xl font-extrabold ${audit.score >= 80 ? 'text-success' : audit.score >= 50 ? 'text-warning' : 'text-danger'}`}>
                      {audit.score}%
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Adherence</span>
                  </div>
                </div>

                <ProgressBar value={audit.score} size="sm" />
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Based on yes/no/partial question scoring matrix parameters.
                </p>
              </div>

              {/* Comments Feed */}
              <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-slate-400" />
                    Audit Notes Feed
                  </h3>
                  
                  <div className="space-y-3.5 max-h-56 overflow-y-auto mt-4 pr-1">
                    {comments.map((comm) => (
                      <div key={comm.id} className="text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>{comm.user}</span>
                          <span className="font-semibold text-slate-400">
                            {new Date(comm.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 leading-normal text-slate-650 dark:text-slate-350">
                          {comm.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-50 dark:border-slate-800/80 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Checklist Answers table */}
        {activeTab === 'checklist' && (
          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Checklist Verification Table</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Summary of requirements matching their compliance scores</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/35 border-b border-slate-200/60 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Control</th>
                    <th className="px-6 py-4">Requirement</th>
                    <th className="px-6 py-4">Adherence Status</th>
                    <th className="px-6 py-4">Auditor Comments / Findings Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                  {tpl?.questions.map((q) => {
                    const ans = audit.answers.find((a) => a.questionId === q.id);

                    const getAdherenceBadge = (val?: 'yes' | 'no' | 'partial' | null) => {
                      if (val === 'yes') return <Badge variant="success" className="w-18 justify-center">YES</Badge>;
                      if (val === 'no') return <Badge variant="danger" className="w-18 justify-center">NO</Badge>;
                      if (val === 'partial') return <Badge variant="warning" className="w-18 justify-center">PARTIAL</Badge>;
                      return <Badge variant="neutral" className="w-18 justify-center">UNANSWERED</Badge>;
                    };

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold px-2 py-1 rounded-lg border border-slate-200/20 text-[10px]">
                            {q.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white max-w-xs md:max-w-md">
                          {q.text}
                        </td>
                        <td className="px-6 py-4">{getAdherenceBadge(ans?.value)}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic">
                          {ans?.comment || <span className="text-slate-350 italic">None logged</span>}
                          {ans?.evidenceFileName && (
                            <span className="block mt-1 font-semibold text-primary dark:text-primary-light not-italic flex items-center gap-1">
                              <FileIcon className="h-3.5 w-3.5" />
                              {ans.evidenceFileName}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Findings List */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            {auditFindings.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">
                No non-conformities raised in this audit.
              </div>
            ) : (
              auditFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between gap-4 sm:items-center"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={finding.severity === 'critical' || finding.severity === 'high' ? 'danger' : 'warning'} size="sm">
                        {finding.severity.toUpperCase()} SEVERITY
                      </Badge>
                      <Badge variant={finding.status === 'resolved' ? 'success' : finding.status === 'open' ? 'danger' : 'warning'} size="sm">
                        {finding.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-normal">
                      {finding.description}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/findings')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-primary dark:text-primary-light border border-primary/20 hover:bg-primary/5 rounded-xl transition-all flex-shrink-0"
                  >
                    Manage Finding
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Audit Timeline history logs */}
        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-2">
              Timeline Audit Trail
            </h3>

            <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6 text-xs">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] text-slate-450 block font-semibold">
                  {new Date(audit.createdAt).toLocaleString()}
                </span>
                <span className="font-bold text-slate-900 dark:text-white block mt-0.5">Audit Initialized</span>
                <p className="text-slate-500 mt-1 leading-normal max-w-md">
                  Lead auditor scheduled the verification checks using {tpl?.name}.
                </p>
              </div>

              {/* Event 2 (if in progress or completed) */}
              {audit.answers.length > 0 && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-900 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </span>
                  <span className="text-[10px] text-slate-450 block font-semibold">
                    {new Date(audit.createdAt).toLocaleString()}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white block mt-0.5">Checklist Work Commenced</span>
                  <p className="text-slate-500 mt-1 leading-normal max-w-md">
                    Auditor started grading questions and gathering files.
                  </p>
                </div>
              )}

              {/* Event 3 (if closed) */}
              {audit.status === 'closed' && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-rose-500 bg-white dark:bg-slate-900 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  </span>
                  <span className="text-[10px] text-slate-450 block font-semibold">
                    {audit.completedAt ? new Date(audit.completedAt).toLocaleString() : 'N/A'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white block mt-0.5">Audit Closed & Reports Compiled</span>
                  <p className="text-slate-500 mt-1 leading-normal max-w-md font-medium">
                    Final responses submitted. overall compliance score calculated at {audit.score}%. Findings automatically raised.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI-generated audit report */}
      <AIReportPanel auditId={audit.id} auditClosed={audit.status === 'closed'} />

      {/* Collaboration */}
      <CommentsPanel auditId={audit.id} />
    </div>
  );
};
