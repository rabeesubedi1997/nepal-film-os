import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Edit3, Trash2, Calendar, User, AlertTriangle, Clock, Flag } from 'lucide-react';
import { taskService } from '../services/taskService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const priorityBadgeMap = { low: 'slate', medium: 'blue', high: 'amber', urgent: 'red' };
const priorityLabelMap = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

const statusColumns = [
  { key: 'todo', label: 'To Do', color: 'border-t-slate-600' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-blue-500' },
  { key: 'done', label: 'Done', color: 'border-t-emerald-500' },
];

export default function TaskView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [formData, setFormData] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = tasks.filter(t => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase()) || 
                        t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePageSizeChange = (size) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await taskService.index(filmId);
      setTasks(data.tasks || data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditTask(null);
    setFormData({ title: '', description: '', assignee: '', due_date: '', priority: 'medium', status: 'todo' });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditTask(t);
    setFormData({
      title: t.title || '',
      description: t.description || '',
      assignee: t.assignee || '',
      due_date: t.due_date?.split('T')[0] || '',
      priority: t.priority || 'medium',
      status: t.status || 'todo',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editTask) {
        await taskService.update(filmId, editTask.id, formData);
      } else {
        await taskService.store(filmId, formData);
      }
      setShowModal(false);
      fetchData();
      addToast(editTask ? 'Task updated' : 'Task created');
    } catch (err) { console.error('Failed to save task:', err); addToast('Failed to save task', 'error'); }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await taskService.destroy(filmId, id); fetchData(); addToast('Task deleted'); } catch (err) { console.error(err); addToast('Failed to delete task', 'error'); }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await taskService.update(filmId, taskId, { status: newStatus });
      fetchData();
      addToast('Task status updated');
    } catch (err) { console.error('Failed to update task status:', err); addToast('Failed to update status', 'error'); }
  };

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const highPriorityCount = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
  const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-amber-400" /> Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {tasks.length} tasks · {tasks.filter(t => t.status === 'done').length} completed</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Task</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: tasks.length, sub: 'All statuses', color: 'text-amber-400', icon: CheckSquare },
          { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, sub: `${tasks.length ? Math.round(tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0}% done`, color: 'text-emerald-400', icon: CheckSquare },
          { label: 'High Priority', value: highPriorityCount, sub: 'Urgent or High', color: 'text-red-400', icon: AlertTriangle },
          { label: 'Overdue', value: overdueCount, sub: 'Past due date', color: 'text-rose-400', icon: Clock },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 uppercase font-bold">{k.label}</p>
                <Icon className={`h-4 w-4 ${k.color} opacity-50`} />
              </div>
              <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusColumns.map(col => {
          const colTasks = getTasksByStatus(col.key);
          return (
            <div key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTask) {
                  updateStatus(draggedTask, col.key);
                  setDraggedTask(null);
                }
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className={`px-4 py-3 border-t-4 ${col.color} bg-slate-800/40 border-b border-slate-800`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">{col.label}</h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
              </div>

              <div className="p-3 space-y-2 min-h-[200px]">
                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-600 text-xs">No tasks</div>
                )}
                {colTasks.map(task => (
                  <div key={task.id}
                    draggable
                    onDragStart={() => setDraggedTask(task.id)}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-colors group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-200 leading-snug flex-1">{task.title}</p>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openEdit(task)} className="p-1 text-slate-500 hover:text-amber-400 rounded"><Edit3 className="h-3 w-3" /></button>
                        <button onClick={() => deleteTask(task.id)} className="p-1 text-slate-500 hover:text-red-400 rounded"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge color={priorityBadgeMap[task.priority] || 'slate'}><Flag className="h-2.5 w-2.5" /> {priorityLabelMap[task.priority] || 'Medium'}</Badge>
                      {task.assignee && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <User className="h-3 w-3" /> {task.assignee}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`text-[10px] flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-slate-500'}`}>
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {col.key !== 'done' && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50 flex gap-1">
                        {col.key === 'todo' && (
                          <button onClick={() => updateStatus(task.id, 'in_progress')} className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold">Start</button>
                        )}
                        {col.key === 'in_progress' && (
                          <>
                            <button onClick={() => updateStatus(task.id, 'done')} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold">Complete</button>
                            <button onClick={() => updateStatus(task.id, 'todo')} className="text-[10px] text-slate-500 hover:text-slate-400 font-semibold">Move back</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTask ? 'Edit Task' : 'Add New Task'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Title" value={formData.title} onChange={handleInput} name="title" required placeholder="e.g., Book location permit" />
          <Input label="Description" value={formData.description} onChange={handleInput} name="description" placeholder="Detailed task description..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Assignee" value={formData.assignee} onChange={handleInput} name="assignee" placeholder="Person responsible" />
            <Input label="Due Date" type="date" value={formData.due_date} onChange={handleInput} name="due_date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Priority" value={formData.priority} onChange={handleInput} name="priority" options={['low', 'medium', 'high', 'urgent']} />
            <Input label="Status" value={formData.status} onChange={handleInput} name="status" options={['todo', 'in_progress', 'done']} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editTask ? 'Update' : 'Create'} Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
