import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Upload,
  Save,
  Send,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import type { AuditAnswer } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { uploadsApi } from '../../api/uploads';
import { apiErrorMessage } from '../../api/client';

export const AuditExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { audits, templates, saveAuditAnswers } = useData();
  const { addToast } = useNotifications();

  // Find audit
  const audit = audits.find((a) => a.id === id);
  const template = audit ? templates.find((t) => t.id === audit.templateId) : null;

  // Local state for answers list
  const [answers, setAnswers] = useState<AuditAnswer[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync default answers
  useEffect(() => {
    if (audit && template) {
      const initialAnswers = template.questions.map((q) => {
        const existingAnswer = audit.answers.find((a) => a.questionId === q.id);
        return {
          questionId: q.id,
          value: existingAnswer?.value || null,
          comment: existingAnswer?.comment || '',
          evidenceFileName: existingAnswer?.evidenceFileName || '',
          evidenceUrl: existingAnswer?.evidenceUrl || '',
        };
      });
      setAnswers(initialAnswers);
    }
  }, [audit, template]);

  if (!audit || !template) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-darkbg-card rounded-2xl border border-slate-100 dark:border-slate-800">
        Audit checklist workspace not found.
      </div>
    );
  }

  const handleOptionChange = (questionId: string, val: 'yes' | 'no' | 'partial') => {
    setAnswers((prev) =>
      prev.map((ans) => (ans.questionId === questionId ? { ...ans, value: val } : ans))
    );
  };

  const handleCommentChange = (questionId: string, text: string) => {
    setAnswers((prev) =>
      prev.map((ans) => (ans.questionId === questionId ? { ...ans, comment: text } : ans))
    );
  };

  const handleEvidenceUpload = async (questionId: string, file: File) => {
    try {
      const result = await uploadsApi.upload(file);
      setAnswers((prev) =>
        prev.map((ans) =>
          ans.questionId === questionId
            ? {
                ...ans,
                evidenceFileName: result.fileName,
                evidenceUrl: result.url,
              }
            : ans
        )
      );
      addToast(`Evidence document "${result.fileName}" uploaded successfully.`, 'success');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to upload evidence file.'), 'danger');
    }
  };

  const handleRemoveEvidence = (questionId: string) => {
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.questionId === questionId ? { ...ans, evidenceFileName: '', evidenceUrl: '' } : ans
      )
    );
    addToast('Evidence file removed.', 'info');
  };

  const handleSaveDraft = async () => {
    await saveAuditAnswers(audit.id, answers, false);
    navigate('/audits');
  };

  const handleConfirmSubmit = () => {
    // Check if any question remains unanswered
    const unanswered = answers.some((ans) => ans.value === null);
    if (unanswered) {
      addToast('All questions must be answered before final audit submission.', 'warning');
      return;
    }
    
    // Check if a comment is missing for Partial/No answers
    const missingJustification = answers.some(
      (ans) => (ans.value === 'no' || ans.value === 'partial') && !ans.comment?.trim()
    );
    if (missingJustification) {
      addToast('Please provide a comment explaining any partial or non-compliant answers.', 'warning');
      return;
    }

    setIsSubmitModalOpen(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      await saveAuditAnswers(audit.id, answers, true);
      setIsSubmitModalOpen(false);
      navigate('/audits');
    } catch (err) {
      addToast('Error during final audit report submission.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculating answering completion metrics
  const answeredCount = answers.filter((a) => a.value !== null).length;
  const totalCount = template.questions.length;
  const progressPct = Math.round((answeredCount / totalCount) * 100);

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
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Audit Checklist Execution Sheet
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
              Template: {template.name} ({totalCount} Controls)
            </span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleSaveDraft}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold text-slate-650 dark:text-slate-400 transition-all"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={handleConfirmSubmit}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md transition-all animate-pulse"
          >
            <Send className="h-4 w-4" />
            Submit Final
          </button>
        </div>
      </div>

      {/* Checklist Progress Status bar */}
      <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-4.5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 w-full md:w-80">
          <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">Answering Completion</span>
          <span className="text-[10px] text-slate-400 font-semibold block">You must address 100% of questions before submission</span>
        </div>
        <div className="w-full md:flex-1 max-w-md flex items-center gap-4">
          <ProgressBar value={progressPct} size="md" className="flex-1" />
          <span className="text-xs font-extrabold text-slate-900 dark:text-white flex-shrink-0">
            {answeredCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Checklist questions cards */}
      <div className="space-y-4">
        {template.questions.map((q, idx) => {
          const ans = answers.find((a) => a.questionId === q.id) || {
            value: null,
            comment: '',
            evidenceFileName: '',
          };

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4"
            >
              {/* Question metadata header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-normal">
                      {q.text}
                    </h3>
                    <span className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-lg text-[9px] inline-block mt-1">
                      {q.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Answering grid & comments input */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-50 dark:border-slate-850/80">
                {/* 1. Answer Option buttons */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                    Adherence Grading
                  </span>
                  <div className="flex gap-2 pt-1.5">
                    {/* YES option */}
                    <button
                      type="button"
                      onClick={() => handleOptionChange(q.id, 'yes')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        ans.value === 'yes'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Yes
                    </button>
                    
                    {/* PARTIAL option */}
                    <button
                      type="button"
                      onClick={() => handleOptionChange(q.id, 'partial')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        ans.value === 'partial'
                          ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Partial
                    </button>

                    {/* NO option */}
                    <button
                      type="button"
                      onClick={() => handleOptionChange(q.id, 'no')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        ans.value === 'no'
                          ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      No
                    </button>
                  </div>
                </div>

                {/* 2. Text comment field */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                    Auditor Comments / Findings Notes
                  </span>
                  <input
                    type="text"
                    placeholder="Log comments, rationale, or gaps identified..."
                    value={ans.comment}
                    onChange={(e) => handleCommentChange(q.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* 3. Evidence File mock upload */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                    Evidence File Attachment
                  </span>
                  {ans.evidenceFileName ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-primary dark:text-primary-light font-bold mt-1.5">
                      <span className="truncate max-w-[150px]">{ans.evidenceFileName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(q.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative mt-1">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleEvidenceUpload(q.id, file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center justify-center gap-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs text-slate-500 font-bold transition-all">
                        <Upload className="h-4 w-4 text-slate-400" />
                        Attach file evidence
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FINAL SUBMISSION CONFIRMATION MODAL */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="Confirm Final Audit Submission">
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-350 rounded-2xl flex gap-3 text-xs leading-relaxed">
            <AlertTriangle className="h-5.5 w-5.5 text-warning flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Warning: Final Submission</span>
              Submitting the audit will calculate the compliance score and close the audit. Any items marked "No" or "Partial" will automatically raise Non-Conformities (Findings) assigned to department managers.
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end gap-2">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-55 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
            >
              {submitting ? 'Submitting Report...' : 'Publish Audit & Close'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
