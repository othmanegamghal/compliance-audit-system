import React, { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useNotifications } from '../../context/NotificationContext';
import { commentsApi } from '../../api/misc';
import { apiErrorMessage } from '../../api/client';
import type { Comment } from '../../types';
import { MessageSquare, Send } from 'lucide-react';

interface CommentsPanelProps {
  auditId?: string;
  findingId?: string;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ auditId, findingId }) => {
  const { t, formatDate, formatTime } = useLocale();
  const { addToast } = useNotifications();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setComments(await commentsApi.list({ auditId, findingId }));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId, findingId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const comment = await commentsApi.create({ auditId, findingId, content: text.trim() });
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to post comment.'), 'danger');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-2">
        <MessageSquare className="h-4.5 w-4.5 text-slate-400" />
        {t('comment.title')}
      </h3>

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t('comment.none')}</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                <img src={c.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} alt={c.userName} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{c.userName}</span>
                  <span className="text-[9px] text-slate-400">{formatDate(c.date)} · {formatTime(c.date)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('comment.placeholder')}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button type="submit" disabled={sending} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60">
          <Send className="h-3.5 w-3.5" />
          {t('comment.send')}
        </button>
      </form>
    </div>
  );
};
