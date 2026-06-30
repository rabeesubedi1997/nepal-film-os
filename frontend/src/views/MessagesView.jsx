import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Send, CheckCircle, User, Clock, Megaphone, Trash2 } from 'lucide-react';
import { messageService } from '../services/messageService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

export default function MessagesView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await messageService.index(filmId);
      setMessages(data || []);
    } catch (err) { console.error('Failed to load messages:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openNew = () => {
    setFormData({ receiver_id: '', message: '', is_announcement: 'false' });
    setShowModal(true);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      await messageService.store(filmId, {
        receiver_id: parseInt(formData.receiver_id),
        message: formData.message,
        is_announcement: formData.is_announcement === 'true',
      });
      setShowModal(false);
      fetchData();
      addToast('Message sent');
    } catch (err) { console.error('Failed to send message:', err); addToast('Failed to send message', 'error'); }
  };

  const deleteMessage = async (id) => {
    try {
      await messageService.destroy(filmId, id);
      fetchData();
      addToast('Message deleted');
    } catch (err) { console.error(err); addToast('Failed to delete message', 'error'); }
  };

  const markRead = async (id) => {
    try {
      await messageService.markRead(filmId, id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
      addToast('Message marked as read');
    } catch (err) { console.error(err); addToast('Failed to mark as read', 'error'); }
  };

  const paginatedMessages = messages.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(messages.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [messages]);

  const totalMessages = messages.length;
  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-400" /> Messages
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {unreadCount} unread</p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5" /> New Message</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total Messages</p>
          <p className="text-xl font-black text-slate-100 mt-1">{totalMessages}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Unread</p>
          <p className="text-xl font-black text-amber-400 mt-1">{unreadCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Announcements</p>
          <p className="text-xl font-black text-rose-400 mt-1">{messages.filter(m => m.is_announcement).length}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
        {messages.length === 0 && <div className="px-5 py-12 text-center text-slate-500 text-sm"><MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No messages yet.</p></div>}
        {paginatedMessages.map(m => (
          <div key={m.id} className={`px-5 py-4 hover:bg-slate-800/30 transition-all ${!m.is_read ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 text-[10px]">
                    {m.sender?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-200">{m.sender?.name || `User #${m.sender_id}`}</span>
                    {m.receiver_id && (
                      <span className="text-xs text-slate-500 ml-1">→ {m.receiver?.name || `User #${m.receiver_id}`}</span>
                    )}
                  </div>
                  {m.is_announcement && (
                    <Badge color="red"><Megaphone className="h-2.5 w-2.5" /> Announcement</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{m.message}</p>
                <p className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => deleteMessage(m.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
                {!m.is_read ? (
                  <button onClick={() => markRead(m.id)}
                    className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg" title="Mark as read">
                    <CheckCircle className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="p-1.5 text-emerald-500" title="Read"><CheckCircle className="h-4 w-4" /></span>
                )}
              </div>
            </div>
          </div>
        ))}
        {messages.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={messages.length} showPageSizeSelector onPageSizeChange={setPageSize} />
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Message">
        <form onSubmit={sendMessage} className="space-y-4">
          <Input label="Receiver ID" type="number" value={formData.receiver_id} onChange={handleInput} name="receiver_id" required placeholder="User ID" />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Message *</label>
            <textarea value={formData.message} onChange={handleInput} name="message" rows={4} required placeholder="Type your message..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-slate-600 resize-none" />
          </div>
          <Input label="Is Announcement" value={formData.is_announcement} onChange={handleInput} name="is_announcement" options={['false', 'true']} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit"><Send className="h-3.5 w-3.5" /> Send Message</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
