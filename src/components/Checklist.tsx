import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, Check, Trash2, Pencil } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { SectionTitle, Card, GoldDivider } from './_nikahly';

type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
interface ChecklistProps { weddingId: string; }

export function Checklist({ weddingId }: ChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', description: '', due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high', category: '',
  });

  useEffect(() => { loadItems(); }, [weddingId]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase.from('checklist_items').select('*')
        .eq('wedding_id', weddingId).order('completed').order('due_date', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (err) { console.error('Error loading checklist:', err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title, description: formData.description,
        due_date: formData.due_date || null, priority: formData.priority, category: formData.category,
      };
      if (editingItem) {
        const { error } = await supabase.from('checklist_items').update(payload).eq('id', editingItem);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('checklist_items').insert({ wedding_id: weddingId, ...payload });
        if (error) throw error;
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ title: '', description: '', due_date: '', priority: 'medium', category: '' });
      loadItems();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save task'); }
  };

  const startEdit = (item: ChecklistItem) => {
    setFormData({
      title: item.title, description: item.description || '',
      due_date: item.due_date || '', priority: item.priority, category: item.category || '',
    });
    setEditingItem(item.id);
    setShowForm(true);
  };

  const toggleComplete = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('checklist_items').update({ completed: !currentStatus }).eq('id', itemId);
      if (error) throw error;
      loadItems();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update task'); }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const { error } = await supabase.from('checklist_items').delete().eq('id', itemId);
      if (error) throw error;
      loadItems();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete task'); }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const priorityBorder = (p: string) =>
    p === 'high' ? 'border-l-rose-500' : p === 'medium' ? 'border-l-gold-500' : 'border-l-indigo-200';

  const priorityChip = (p: string) =>
    p === 'high' ? 'bg-rose-100 text-rose-600' :
    p === 'medium' ? 'bg-gold-100 text-gold-700' :
    'bg-ivory-300 text-indigo-900/60';

  const stats = {
    total: items.length,
    completed: items.filter((i) => i.completed).length,
    pending: items.filter((i) => !i.completed).length,
  };

  if (loading) return <div className="text-center py-12 text-indigo-900/60 font-display italic">Loading checklist…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <SectionTitle eyebrow="Jadwal · الجدول" title="Checklist" subtitle="Track tasks and stay organised" />
        <button onClick={() => { setShowForm(!showForm); setEditingItem(null); setFormData({ title: '', description: '', due_date: '', priority: 'medium', category: '' }); }}
          className="nk-btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /><span>Add Task</span>
        </button>
      </div>

      <GoldDivider className="w-full" />

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="nk-eyebrow mb-1">Total</div>
          <p className="text-4xl font-display font-semibold text-indigo-900">{stats.total}</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="nk-eyebrow mb-1">Completed</div>
          <p className="text-4xl font-display font-semibold text-emerald-500">{stats.completed}</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="nk-eyebrow mb-1">Pending</div>
          <p className="text-4xl font-display font-semibold text-gold-700">{stats.pending}</p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">
            {editingItem ? 'Edit task' : 'Add new task'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="nk-label">Task title *</label>
              <input type="text" value={formData.title} required className="nk-input"
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <label className="nk-label">Description</label>
              <textarea value={formData.description} className="nk-input" rows={3}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="nk-label">Due date</label>
                <input type="date" value={formData.due_date} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Priority</label>
                <select value={formData.priority} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="nk-label">Category</label>
                <input type="text" value={formData.category} className="nk-input" placeholder="e.g., Venue, Nikah"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="nk-btn-primary flex-1">{editingItem ? 'Save Task' : 'Add Task'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }} className="nk-btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-indigo-900/50 font-display italic">No tasks yet. Click "Add Task" to get started.</p>
          </Card>
        ) : items.map((item) => (
          <div key={item.id}
            className={`nk-card border-l-4 p-4 transition-all ${priorityBorder(item.priority)} ${item.completed ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-4">
              <button onClick={() => toggleComplete(item.id, item.completed)}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-indigo-900/25 hover:border-emerald-500'}`}>
                {item.completed && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className={`font-semibold text-indigo-900 ${item.completed ? 'line-through text-indigo-900/40' : ''}`}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm text-indigo-900/60 mt-0.5">{item.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.due_date && (
                        <div className="flex items-center text-xs text-indigo-900/50">
                          <Calendar className="w-3 h-3 mr-1 text-gold-500" />
                          {formatDate(item.due_date)}
                        </div>
                      )}
                      <span className={`nk-chip ${priorityChip(item.priority)}`}>{item.priority}</span>
                      {item.category && (
                        <span className="nk-chip bg-ivory-200 text-indigo-900/60">{item.category}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(item)} className="text-gold-600 hover:text-gold-700 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
