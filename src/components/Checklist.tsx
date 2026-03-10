import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, Check, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';

type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];

interface ChecklistProps {
  weddingId: string;
}

export function Checklist({ weddingId }: ChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
  });

  useEffect(() => {
    loadItems();
  }, [weddingId]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('completed')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error loading checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('checklist_items').insert({
        wedding_id: weddingId,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date || null,
        priority: formData.priority,
        category: formData.category,
      });

      if (error) throw error;
      setShowForm(false);
      setFormData({ title: '', description: '', due_date: '', priority: 'medium', category: '' });
      loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add task');
    }
  };

  const toggleComplete = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ completed: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;
      loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const { error } = await supabase.from('checklist_items').delete().eq('id', itemId);
      if (error) throw error;
      loadItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: items.length,
    completed: items.filter((i) => i.completed).length,
    pending: items.filter((i) => !i.completed).length,
  };

  if (loading) {
    return <div className="text-center py-12">Loading checklist...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wedding Checklist</h2>
          <p className="text-gray-600 mt-1">Track tasks and stay organized</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="e.g., Planning, Vendors"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <p className="text-gray-500">No tasks yet. Click "Add Task" to get started.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-sm border-l-4 p-4 hover:shadow-md transition-all ${getPriorityColor(
                item.priority
              )} ${item.completed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <button
                  onClick={() => toggleComplete(item.id, item.completed)}
                  className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    item.completed
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {item.completed && <Check className="w-4 h-4 text-white" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold text-gray-900 ${item.completed ? 'line-through' : ''}`}>
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-2">
                        {item.due_date && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(item.due_date)}
                          </div>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(item.priority)}`}>
                          {item.priority}
                        </span>
                        {item.category && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="ml-4 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
