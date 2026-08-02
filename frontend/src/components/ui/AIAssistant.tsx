import React, { useEffect, useRef, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { aiApi } from '../../api/ai';
import { apiErrorMessage } from '../../api/client';
import { Sparkles, X, Send } from 'lucide-react';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
}

export const AIAssistant: React.FC = () => {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', text: t('assistant.welcome') }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || thinking) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setThinking(true);
    try {
      const answer = await aiApi.ask(q);
      setMessages((m) => [...m, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: apiErrorMessage(err, t('ai.failed')) }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t('assistant.title')}
          className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl hover:scale-105 transition-transform flex items-center justify-center"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white dark:bg-darkbg-card border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5" />
              <div>
                <span className="text-sm font-bold block leading-tight">{t('assistant.title')}</span>
                <span className="text-[10px] text-violet-100 font-medium">{t('assistant.subtitle')}</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/15 transition-colors" aria-label="Close">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="h-3 w-3 border-2 border-violet-500 border-t-transparent animate-spin rounded-full" />
                  {t('assistant.thinking')}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('assistant.placeholder')}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={thinking || !input.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
