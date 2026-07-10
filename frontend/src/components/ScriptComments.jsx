import { useState, useEffect, useCallback } from 'react';
import {
  X, MessageSquare, CheckCircle, RotateCcw, Trash2, Send,
  Reply, Pin, Loader, FileText
} from 'lucide-react';
import { scriptCommentService } from '../services/scriptCommentService';
import { useAuthStore } from '../authStore';

function getAnchorLabel(selector) {
  if (!selector) return null;
  const parts = selector.split(':');
  if (parts[0] === 'p') return `Paragraph ${parseInt(parts[1]) + 1}`;
  if (parts[0] === 'scene') return `Scene ${parseInt(parts[1]) + 1}`;
  return selector;
}

function getAvatarColor(name) {
  const colors = [
    'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CommentItem({ comment, filmId, scriptId, editor, onRefresh, currentUserId }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isResolved = !!comment.resolved_at;
  const isOwn = comment.user_id === currentUserId;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await scriptCommentService.store(filmId, scriptId, {
        content: replyText,
        parent_id: comment.id,
      });
      setReplyText('');
      setShowReply(false);
      onRefresh();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleResolveToggle = async () => {
    try {
      if (isResolved) {
        await scriptCommentService.reopen(filmId, scriptId, comment.id);
      } else {
        await scriptCommentService.resolve(filmId, scriptId, comment.id);
      }
      onRefresh();
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    try {
      await scriptCommentService.destroy(filmId, scriptId, comment.id);
      onRefresh();
    } catch { /* ignore */ }
  };

  const handleAnchorClick = () => {
    if (!editor || !comment.element_selector) return;
    const parts = comment.element_selector.split(':');
    const pos = parseInt(parts[1]);
    if (isNaN(pos)) return;
    let idx = 0;
    editor.state.doc.descendants((node, nodePos) => {
      if (node.type.name === 'screenplayNode' || node.type.name === 'paragraph') {
        if (idx === pos) {
          editor.chain().focus().setTextSelection(nodePos).scrollIntoView().run();
        }
        idx++;
      }
    });
  };

  return (
    <div className={`border-l-2 pl-3 py-2 ${isResolved ? 'border-emerald-500/50' : 'border-amber-500/70'}`}>
      <div className="flex items-start gap-2">
        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(comment.user?.name)}`}>
          {(comment.user?.name || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-200">{comment.user?.name || 'Unknown'}</span>
            <span className="text-[10px] text-slate-500">{formatDate(comment.created_at)}</span>
            {isResolved && (
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-medium">Resolved</span>
            )}
          </div>
          {comment.element_selector && (
            <button onClick={handleAnchorClick}
              className="flex items-center gap-1 text-[9px] text-amber-400 hover:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded mt-0.5 transition-colors">
              <Pin className="h-2.5 w-2.5" />
              {getAnchorLabel(comment.element_selector)}
            </button>
          )}
          <p className="text-[12px] text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <button onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-amber-400 transition-colors">
              <Reply className="h-3 w-3" /> Reply
            </button>
            <button onClick={handleResolveToggle}
              className={`flex items-center gap-1 text-[9px] transition-colors ${
                isResolved ? 'text-slate-500 hover:text-amber-400' : 'text-slate-500 hover:text-emerald-400'
              }`}>
              {isResolved ? <RotateCcw className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
              {isResolved ? 'Reopen' : 'Resolve'}
            </button>
            {isOwn && (
              <button onClick={handleDelete}
                className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
          </div>

          {showReply && (
            <div className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                placeholder="Write a reply..."
                className="flex-1 bg-slate-800 border border-slate-700 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
              />
              <button onClick={handleReply} disabled={submitting || !replyText.trim()}
                className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                {submitting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {comment.replies?.length > 0 && (
            <div className="mt-2 pl-3 border-l border-slate-700/50 space-y-2">
              {comment.replies.map(reply => (
                <div key={reply.id} className="flex items-start gap-1.5 py-1">
                  <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${getAvatarColor(reply.user?.name)}`}>
                    {(reply.user?.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-300">{reply.user?.name || 'Unknown'}</span>
                      <span className="text-[9px] text-slate-600">{formatDate(reply.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScriptComments({ editor, filmId, scriptId, onClose }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [anchorSelector, setAnchorSelector] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!filmId || !scriptId) return;
    setLoading(true);
    try {
      const res = await scriptCommentService.index(filmId, scriptId);
      setComments(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filmId, scriptId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleAnchorSelection = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      setAnchorSelector(null);
      return;
    }
    let idx = 0;
    let foundPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'screenplayNode' || node.type.name === 'paragraph') {
        if (pos <= from && from < pos + node.nodeSize) {
          foundPos = idx;
        }
        idx++;
      }
    });
    if (foundPos >= 0) {
      setAnchorSelector(`p:${foundPos}`);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !scriptId) return;
    setSubmitting(true);
    try {
      await scriptCommentService.store(filmId, scriptId, {
        content: newComment,
        element_selector: anchorSelector,
      });
      setNewComment('');
      setAnchorSelector(null);
      fetchComments();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm">
      <div className="h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100">Comments</h2>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">{comments.length}</span>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onFocus={handleAnchorSelection}
                placeholder="Add a comment... (select text in script to anchor)"
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none"
              />
              {anchorSelector && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Pin className="h-2.5 w-2.5" />
                    {getAnchorLabel(anchorSelector)}
                  </span>
                  <button onClick={() => setAnchorSelector(null)}
                    className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors">
                    Remove
                  </button>
                </div>
              )}
            </div>
            <button onClick={handleSubmit} disabled={submitting || !newComment.trim()}
              className="self-end p-2 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50">
              {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-5 w-5 text-slate-500 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-slate-700 mb-2" />
              <p className="text-xs text-slate-500 font-medium">No comments yet</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Select text in the script to anchor a comment.</p>
            </div>
          ) : (
            comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                filmId={filmId}
                scriptId={scriptId}
                editor={editor}
                onRefresh={fetchComments}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
