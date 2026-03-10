import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Check } from 'lucide-react';
import type { Database } from '../lib/database.types';

type BudgetCategory = Database['public']['Tables']['budget_categories']['Row'];
type BudgetItem = Database['public']['Tables']['budget_items']['Row'];

interface BudgetProps {
  weddingId: string;
}

export function Budget({ weddingId }: BudgetProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    allocated_amount: '',
    color: '#ef4444',
  });
  const [itemFormData, setItemFormData] = useState({
    category_id: '',
    name: '',
    estimated_cost: '',
    actual_cost: '',
    paid: false,
    payment_date: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [weddingId]);

  const loadData = async () => {
    try {
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase.from('budget_categories').select('*').eq('wedding_id', weddingId).order('created_at'),
        supabase.from('budget_items').select('*').eq('wedding_id', weddingId).order('created_at'),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;

      setCategories(categoriesResult.data || []);
      setItems(itemsResult.data || []);
    } catch (err) {
      console.error('Error loading budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('budget_categories').insert({
        wedding_id: weddingId,
        name: categoryFormData.name,
        allocated_amount: parseFloat(categoryFormData.allocated_amount) || 0,
        color: categoryFormData.color,
      });

      if (error) throw error;
      setShowCategoryForm(false);
      setCategoryFormData({ name: '', allocated_amount: '', color: '#ef4444' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add category');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('budget_items').insert({
        wedding_id: weddingId,
        category_id: itemFormData.category_id,
        name: itemFormData.name,
        estimated_cost: parseFloat(itemFormData.estimated_cost) || 0,
        actual_cost: parseFloat(itemFormData.actual_cost) || 0,
        paid: itemFormData.paid,
        payment_date: itemFormData.payment_date || null,
        notes: itemFormData.notes,
      });

      if (error) throw error;
      setShowItemForm(false);
      setItemFormData({ category_id: '', name: '', estimated_cost: '', actual_cost: '', paid: false, payment_date: '', notes: '' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    try {
      const { error } = await supabase.from('budget_categories').delete().eq('id', categoryId);
      if (error) throw error;
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this budget item?')) return;
    try {
      const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
      if (error) throw error;
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const togglePaid = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .update({ paid: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryItems = (categoryId: string) => {
    return items.filter((item) => item.category_id === categoryId);
  };

  const getCategorySpent = (categoryId: string) => {
    return getCategoryItems(categoryId).reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  };

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0);
  const totalSpent = items.reduce((sum, item) => sum + (item.actual_cost || 0), 0);

  if (loading) {
    return <div className="text-center py-12">Loading budget...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Management</h2>
          <p className="text-gray-600 mt-1">Track expenses and manage your wedding budget</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setShowItemForm(!showItemForm)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Budget</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalAllocated)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Spent</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          <p className={`text-sm mt-2 ${totalSpent > totalAllocated ? 'text-red-600' : 'text-green-600'}`}>
            {totalAllocated > 0 ? `${((totalSpent / totalAllocated) * 100).toFixed(1)}% of budget` : ''}
          </p>
        </div>
      </div>

      {showCategoryForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Budget Category</h3>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  placeholder="e.g., Venue, Catering"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allocated Amount (₹) *</label>
                <input
                  type="number"
                  value={categoryFormData.allocated_amount}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, allocated_amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Add Category
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showItemForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Budget Item</h3>
          <form onSubmit={handleItemSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={itemFormData.category_id}
                  onChange={(e) => setItemFormData({ ...itemFormData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={itemFormData.estimated_cost}
                  onChange={(e) => setItemFormData({ ...itemFormData, estimated_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Actual Cost (₹)</label>
                <input
                  type="number"
                  value={itemFormData.actual_cost}
                  onChange={(e) => setItemFormData({ ...itemFormData, actual_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                <input
                  type="date"
                  value={itemFormData.payment_date}
                  onChange={(e) => setItemFormData({ ...itemFormData, payment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid</label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemFormData.paid}
                    onChange={(e) => setItemFormData({ ...itemFormData, paid: e.target.checked })}
                    className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700">Mark as paid</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={itemFormData.notes}
                onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                rows={2}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={() => setShowItemForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading budget...</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <p className="text-gray-500">No budget categories yet. Click "Add Category" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = getCategoryItems(category.id);
            const spent = getCategorySpent(category.id);
            const estimated = categoryItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6" style={{ borderLeft: `4px solid ${category.color}` }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">
                          Allocated: <span className="font-semibold">{formatCurrency(category.allocated_amount)}</span>
                        </span>
                        <span className="text-gray-600">
                          Spent: <span className="font-semibold">{formatCurrency(spent)}</span>
                        </span>
                      </div>
                      {category.allocated_amount > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min((spent / category.allocated_amount) * 100, 100)}%`,
                                backgroundColor: spent > category.allocated_amount ? '#ef4444' : category.color,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {categoryItems.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <button
                              onClick={() => togglePaid(item.id, item.paid)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                item.paid
                                  ? 'bg-green-600 border-green-600'
                                  : 'border-gray-300 hover:border-green-500'
                              }`}
                            >
                              {item.paid && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <div className="flex-1">
                              <p className={`font-medium ${item.paid ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {item.name}
                              </p>
                              {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              {item.estimated_cost > 0 && (
                                <p className="text-xs text-gray-500">Est: {formatCurrency(item.estimated_cost)}</p>
                              )}
                              <p className="font-semibold text-gray-900">{formatCurrency(item.actual_cost)}</p>
                            </div>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
