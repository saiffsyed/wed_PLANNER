import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Check, Pencil } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { SectionTitle, Card, GoldDivider } from './_nikahly';

type BudgetCategory = Database['public']['Tables']['budget_categories']['Row'];
type BudgetItem = Database['public']['Tables']['budget_items']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface BudgetProps { weddingId: string; }

export function Budget({ weddingId }: BudgetProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', allocated_amount: '', color: '#c9a84c' });
  const [itemFormData, setItemFormData] = useState({
    category_id: '', event_id: '', name: '', estimated_cost: '', actual_cost: '',
    paid: false, payment_date: '', notes: '',
  });

  useEffect(() => { loadData(); }, [weddingId]);

  const loadData = async () => {
    try {
      const [categoriesResult, itemsResult, eventsResult] = await Promise.all([
        supabase.from('budget_categories').select('*').eq('wedding_id', weddingId).order('created_at'),
        supabase.from('budget_items').select('*').eq('wedding_id', weddingId).order('created_at'),
        supabase.from('events').select('*').eq('wedding_id', weddingId).order('event_date', { ascending: true }),
      ]);
      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (eventsResult.error) throw eventsResult.error;
      setCategories(categoriesResult.data || []);
      setItems(itemsResult.data || []);
      setEvents(eventsResult.data || []);
    } catch (err) { console.error('Error loading budget data:', err); }
    finally { setLoading(false); }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const { error } = await supabase.from('budget_categories').update({
          name: categoryFormData.name,
          allocated_amount: parseFloat(categoryFormData.allocated_amount) || 0,
          color: categoryFormData.color,
        }).eq('id', editingCategory);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('budget_categories').insert({
          wedding_id: weddingId,
          name: categoryFormData.name,
          allocated_amount: parseFloat(categoryFormData.allocated_amount) || 0,
          color: categoryFormData.color,
        });
        if (error) throw error;
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', allocated_amount: '', color: '#c9a84c' });
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save category'); }
  };

  const startEditCategory = (category: BudgetCategory) => {
    setCategoryFormData({ name: category.name, allocated_amount: category.allocated_amount.toString(), color: category.color });
    setEditingCategory(category.id);
    setShowCategoryForm(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemPayload = {
        category_id: itemFormData.category_id,
        event_id: itemFormData.event_id || null,
        name: itemFormData.name,
        estimated_cost: parseFloat(itemFormData.estimated_cost) || 0,
        actual_cost: parseFloat(itemFormData.actual_cost) || 0,
        paid: itemFormData.paid,
        payment_date: itemFormData.payment_date || null,
        notes: itemFormData.notes,
      };
      if (editingItem) {
        const { error } = await supabase.from('budget_items').update(itemPayload).eq('id', editingItem);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('budget_items').insert({ wedding_id: weddingId, ...itemPayload });
        if (error) throw error;
      }
      setShowItemForm(false);
      setEditingItem(null);
      setItemFormData({ category_id: '', event_id: '', name: '', estimated_cost: '', actual_cost: '', paid: false, payment_date: '', notes: '' });
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save item'); }
  };

  const startEditItem = (item: BudgetItem) => {
    setItemFormData({
      category_id: item.category_id, event_id: item.event_id || '', name: item.name,
      estimated_cost: item.estimated_cost.toString(), actual_cost: item.actual_cost.toString(),
      paid: item.paid, payment_date: item.payment_date || '', notes: item.notes || '',
    });
    setEditingItem(item.id);
    setShowItemForm(true);
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    try {
      const { error } = await supabase.from('budget_categories').delete().eq('id', categoryId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete category'); }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this budget item?')) return;
    try {
      const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete item'); }
  };

  const togglePaid = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('budget_items').update({ paid: !currentStatus }).eq('id', itemId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update payment status'); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getCategoryItems = (categoryId: string) => items.filter((item) => item.category_id === categoryId);
  const getCategorySpent = (categoryId: string) =>
    getCategoryItems(categoryId).reduce((sum, item) => sum + (item.actual_cost || 0), 0);

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0);
  const totalSpent = items.reduce((sum, item) => sum + (item.actual_cost || 0), 0);

  if (loading) return <div className="text-center py-12 text-indigo-900/60 font-display italic">Loading budget…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <SectionTitle eyebrow="Maal · المال" title="Budget" subtitle="Track expenses and manage your wedding budget" />
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => { setShowCategoryForm(!showCategoryForm); setEditingCategory(null); setCategoryFormData({ name: '', allocated_amount: '', color: '#c9a84c' }); }}
            className="nk-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /><span>Add Category</span>
          </button>
          <button onClick={() => { setShowItemForm(!showItemForm); setEditingItem(null); setItemFormData({ category_id: '', event_id: '', name: '', estimated_cost: '', actual_cost: '', paid: false, payment_date: '', notes: '' }); }}
            className="nk-btn-gold flex items-center gap-2">
            <Plus className="w-4 h-4" /><span>Add Expense</span>
          </button>
        </div>
      </div>

      <GoldDivider className="w-full" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6">
          <div className="nk-eyebrow mb-2">Total allocated</div>
          <p className="text-4xl font-display font-semibold text-indigo-900">{formatCurrency(totalAllocated)}</p>
        </Card>
        <Card className="p-6">
          <div className="nk-eyebrow mb-2">Total spent</div>
          <p className="text-4xl font-display font-semibold text-emerald-500">{formatCurrency(totalSpent)}</p>
          {totalAllocated > 0 && (
            <>
              <p className={`text-sm mt-1 ${totalSpent > totalAllocated ? 'text-rose-500' : 'text-indigo-900/55'}`}>
                {((totalSpent / totalAllocated) * 100).toFixed(1)}% of budget
              </p>
              <div className="mt-3 h-1.5 bg-ivory-300 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                  style={{ width: `${Math.min((totalSpent / totalAllocated) * 100, 100)}%` }} />
              </div>
            </>
          )}
        </Card>
      </div>

      {showCategoryForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">
            {editingCategory ? 'Edit Category' : 'Add Budget Category'}
          </h3>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="nk-label">Category name *</label>
                <input type="text" value={categoryFormData.name} required className="nk-input"
                  placeholder="e.g., Venue, Catering"
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Allocated amount (₹) *</label>
                <input type="number" value={categoryFormData.allocated_amount} required className="nk-input" min="0"
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, allocated_amount: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Colour</label>
                <input type="color" value={categoryFormData.color} className="w-full h-11 border border-gold-300/40 rounded-lg cursor-pointer bg-ivory-50"
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="nk-btn-primary flex-1">{editingCategory ? 'Save' : 'Add Category'}</button>
              <button type="button" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }} className="nk-btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {showItemForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">
            {editingItem ? 'Edit Expense' : 'Add Budget Item'}
          </h3>
          <form onSubmit={handleItemSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="nk-label">Category *</label>
                <select value={itemFormData.category_id} required className="nk-input"
                  onChange={(e) => setItemFormData({ ...itemFormData, category_id: e.target.value })}>
                  <option value="">Select a category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="nk-label">Item name *</label>
                <input type="text" value={itemFormData.name} required className="nk-input"
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">For event</label>
                <select value={itemFormData.event_id} className="nk-input"
                  onChange={(e) => setItemFormData({ ...itemFormData, event_id: e.target.value })}>
                  <option value="">All / no specific event</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div>
                <label className="nk-label">Estimated cost (₹)</label>
                <input type="number" value={itemFormData.estimated_cost} className="nk-input" min="0"
                  onChange={(e) => setItemFormData({ ...itemFormData, estimated_cost: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Actual cost (₹)</label>
                <input type="number" value={itemFormData.actual_cost} className="nk-input" min="0"
                  onChange={(e) => setItemFormData({ ...itemFormData, actual_cost: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Payment date</label>
                <input type="date" value={itemFormData.payment_date} className="nk-input"
                  onChange={(e) => setItemFormData({ ...itemFormData, payment_date: e.target.value })} />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={itemFormData.paid}
                    onChange={(e) => setItemFormData({ ...itemFormData, paid: e.target.checked })}
                    className="w-5 h-5 accent-gold-500" />
                  <span className="text-sm text-indigo-900">Mark as paid</span>
                </label>
              </div>
            </div>
            <div>
              <label className="nk-label">Notes</label>
              <textarea value={itemFormData.notes} className="nk-input" rows={2}
                onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="nk-btn-gold flex-1">{editingItem ? 'Save' : 'Add Item'}</button>
              <button type="button" onClick={() => { setShowItemForm(false); setEditingItem(null); }} className="nk-btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-indigo-900/50 font-display italic">No budget categories yet. Click "Add Category" to get started.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {categories.map((category) => {
            const categoryItems = getCategoryItems(category.id);
            const spent = getCategorySpent(category.id);
            return (
              <Card key={category.id} className="overflow-hidden">
                <div className="p-6" style={{ borderLeft: `4px solid ${category.color}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-display font-semibold text-indigo-900">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEditCategory(category)} className="text-gold-600 hover:text-gold-700 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCategory(category.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-indigo-900/60 mb-3">
                    <span>Allocated: <span className="font-semibold text-indigo-900">{formatCurrency(category.allocated_amount)}</span></span>
                    <span>Spent: <span className="font-semibold text-emerald-500">{formatCurrency(spent)}</span></span>
                  </div>
                  {category.allocated_amount > 0 && (
                    <div className="h-1.5 bg-ivory-300 rounded-full overflow-hidden mb-4">
                      <div className="h-full transition-all rounded-full"
                        style={{
                          width: `${Math.min((spent / category.allocated_amount) * 100, 100)}%`,
                          background: spent > category.allocated_amount ? '#a23b30' : category.color,
                        }} />
                    </div>
                  )}
                  {categoryItems.length > 0 && (
                    <div className="space-y-2">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-ivory-100 rounded-xl hover:bg-ivory-200 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <button onClick={() => togglePaid(item.id, item.paid)}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                item.paid ? 'bg-emerald-500 border-emerald-500' : 'border-indigo-900/25 hover:border-emerald-500'}`}>
                              {item.paid && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`font-medium ${item.paid ? 'line-through text-indigo-900/40' : 'text-indigo-900'}`}>{item.name}</p>
                                {item.event_id && events.find((ev) => ev.id === item.event_id) && (
                                  <span className="nk-chip bg-gold-100 text-gold-700">
                                    {events.find((ev) => ev.id === item.event_id)!.name}
                                  </span>
                                )}
                              </div>
                              {item.notes && <p className="text-xs text-indigo-900/50">{item.notes}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              {item.estimated_cost > 0 && (
                                <p className="text-xs text-indigo-900/50">Est: {formatCurrency(item.estimated_cost)}</p>
                              )}
                              <p className="font-semibold text-indigo-900">{formatCurrency(item.actual_cost)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => startEditItem(item)} className="text-gold-600 hover:text-gold-700 transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteItem(item.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
