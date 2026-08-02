import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { can } from '../../auth/permissions';
import { Badge } from '../../components/ui/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { aiApi } from '../../api/ai';
import { apiErrorMessage } from '../../api/client';
import {
  FileText,
  Plus,
  Trash2,
  ListPlus,
  ArrowLeft,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Question } from '../../types';

export const TemplateList: React.FC = () => {
  const { templates, createTemplate, users } = useData();
  const { currentUser } = useAuth();
  const { t } = useLocale();
  const { addToast } = useNotifications();

  // Mode state: 'list' or 'create'
  const [mode, setMode] = useState<'list' | 'create'>('list');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([
    { text: 'Is there a formal document control policy established?', category: 'Documentation' },
  ]);

  // AI checklist generator
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(8);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      addToast(t('aigen.topic'), 'warning');
      return;
    }
    setAiGenerating(true);
    try {
      const draft = await aiApi.generateChecklist(aiTopic.trim(), aiCount);
      setName(draft.name);
      setDescription(draft.description);
      if (draft.questions.length) setQuestions(draft.questions);
      addToast(t('aigen.done'), 'success', t('aigen.title'));
    } catch (err) {
      addToast(apiErrorMessage(err, t('ai.failed')), 'danger', t('aigen.title'));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddQuestionRow = () => {
    setQuestions([...questions, { text: '', category: 'General' }]);
  };

  const handleRemoveQuestionRow = (index: number) => {
    if (questions.length === 1) {
      addToast('A checklist template must contain at least one question.', 'warning');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: 'text' | 'category', value: string) => {
    const updated = questions.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    );
    setQuestions(updated);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      addToast('Please enter a Template Name and Description.', 'danger');
      return;
    }

    const emptyText = questions.some((q) => !q.text.trim());
    if (emptyText) {
      addToast('Please fill out all question text fields.', 'danger');
      return;
    }

    // Prepare questions with IDs
    const questionsWithIds = questions.map((q, idx) => ({
      id: `q-custom-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      ...q,
    }));

    createTemplate({
      name,
      description,
      questions: questionsWithIds,
      createdBy: currentUser?.id || 'u-1',
    });

    // Reset Form & Switch Mode
    setName('');
    setDescription('');
    setQuestions([{ text: 'Is there a formal document control policy established?', category: 'Documentation' }]);
    setMode('list');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'list' ? 'Checklist Templates' : 'Create New Checklist Template'}
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            {mode === 'list'
              ? 'Library of compliance checklists used when conducting audits'
              : 'Construct a new template and add standard questions for auditors to evaluate'}
          </p>
        </div>
        {mode === 'list' ? (
          can(currentUser?.role, 'templates.manage') && (
            <button
              onClick={() => setMode('create')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </button>
          )
        ) : (
          <button
            onClick={() => setMode('list')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </button>
        )}
      </div>

      {mode === 'list' ? (
        /* TEMPLATES LIST */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tpl) => {
            const creator = users.find((u) => u.id === tpl.createdBy);

            return (
              <div
                key={tpl.id}
                className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-primary dark:text-primary-light flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {tpl.name}
                        </h3>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                          ID: {tpl.id}
                        </span>
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">
                      {tpl.questions.length} Controls
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="border-t border-slate-50 dark:border-slate-800/85 pt-3.5 space-y-2.5">
                    {/* Preview of categories */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                        Control Groups:
                      </span>
                      {Array.from(new Set(tpl.questions.map((q) => q.category))).slice(0, 4).map((cat) => (
                        <span
                          key={cat}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[9px] font-semibold px-2 py-0.5 rounded-lg border border-slate-200/20"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50 dark:border-slate-800/85 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-300" />
                    Created: {new Date(tpl.createdAt).toLocaleDateString()}
                  </span>
                  <span>By: {creator?.name || 'Administrator'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CREATE TEMPLATE FORM & QUESTION BUILDER */
        <form onSubmit={handleSaveTemplate} className="space-y-6">
          {/* AI checklist generator */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200/60 dark:border-violet-900/40 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{t('aigen.title')}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{t('aigen.hint')}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder={t('aigen.topicPlaceholder')}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-violet-200 dark:border-violet-900/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <select
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="px-3 py-2 text-xs rounded-xl border border-violet-200 dark:border-violet-900/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                title={t('aigen.count')}
              >
                {[5, 8, 10, 12].map((n) => <option key={n} value={n}>{n} {t('aigen.count').toLowerCase().includes('questions') ? '' : 'Q'}</option>)}
              </select>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={aiGenerating}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60"
              >
                {aiGenerating ? (
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiGenerating ? t('aigen.generating') : t('aigen.generate')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800/85 pb-2">
              Template Metadata
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. ISO 27001 Access Control Audit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white dark:focus:bg-slate-900"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">Description / Scope</label>
                <input
                  type="text"
                  placeholder="Describe the regulatory framework and standard verification scope for this checklist..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white dark:focus:bg-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* QUESTION BUILDER BOX */}
          <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Question Checklist Builder
              </h3>
              <button
                type="button"
                onClick={handleAddQuestionRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary text-primary hover:bg-primary/5 text-xs font-bold transition-all"
              >
                <ListPlus className="h-4 w-4" />
                Add Question Control
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 animate-fadeIn"
                >
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-400 font-bold text-xs flex items-center justify-center mt-1.5">
                    {idx + 1}
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                        Audit Question / Requirement
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Is database logging turned on and protected from tampering?"
                        value={q.text}
                        onChange={(e) => handleQuestionChange(idx, 'text', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                        Category / Control Domain
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Logging"
                        value={q.category}
                        onChange={(e) => handleQuestionChange(idx, 'category', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestionRow(idx)}
                    className="mt-6 p-2 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-rose-500 hover:bg-rose-500/5 transition-all"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-4 py-2.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl shadow-md inline-flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Publish Template
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
