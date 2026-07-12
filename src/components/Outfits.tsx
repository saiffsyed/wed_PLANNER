import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Pencil, Check, Store } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { SectionTitle, Card, GoldDivider } from './_nikahly';

type Outfit = Database['public']['Tables']['outfits']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type Wedding = Database['public']['Tables']['weddings']['Row'];

interface OutfitsProps { wedding: Wedding; }

const ITEM_TYPES = ['Outfit', 'Jewelry', 'Footwear', 'Accessories', 'Other'];

const emptyForm = {
  name: '', for_person: '', item_type: 'Outfit', event_id: '',
  shop: '', estimated_cost: '', actual_cost: '', purchased: false, notes: '',
};

export function Outfits({ wedding }: OutfitsProps) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const persons = [wedding.partner1_name, wedding.partner2_name, 'Family', 'Other'].filter(Boolean);

  useEffect(() => { loadData(); }, [wedding.id]);

  const loadData = async () => {
    try {
      const [outfitsResult, eventsResult] = await Promise.all([
        supabase.from('outfits').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('wedding_id', wedding.id).order('event_date', { ascending: true }),
      ]);
      if (outfitsResult.error) throw outfitsResult.error;
      if (eventsResult.error) throw eventsResult.error;
      setOutfits(outfitsResult.data || []);
      setEvents(eventsResult.data || []);
    } catch (err) { console.error('Error loading outfits:', err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingOutfit(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        for_person: formData.for_person,
        item_type: formData.item_type,
        event_id: formData.event_id || null,
        shop: formData.shop,
        estimated_cost: parseFloat(formData.estimated_cost) || 0,
        actual_cost: parseFloat(formData.actual_cost) || 0,
        purchased: formData.purchased,
        notes: formData.notes,
      };
      if (editingOutfit) {
        const { error } = await supabase.from('outfits').update(payload).eq('id', editingOutfit);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('outfits').insert({ wedding_id: wedding.id, ...payload });
        if (error) throw error;
      }
      resetForm();
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save item'); }
  };

  const startEdit = (outfit: Outfit) => {
    setFormData({
      name: outfit.name,
      for_person: outfit.for_person || '',
      item_type: outfit.item_type || 'Outfit',
      event_id: outfit.event_id || '',
      shop: outfit.shop || '',
      estimated_cost: outfit.estimated_cost ? outfit.estimated_cost.toString() : '',
      actual_cost: outfit.actual_cost ? outfit.actual_cost.toString() : '',
      purchased: outfit.purchased,
      notes: outfit.notes || '',
    });
    setEditingOutfit(outfit.id);
    setShowForm(true);
  };

  const deleteOutfit = async (outfitId: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      const { error } = await supabase.from('outfits').delete().eq('id', outfitId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete item'); }
  };

  const togglePurchased = async (outfitId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('outfits').update({ purchased: !currentStatus }).eq('id', outfitId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update status'); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const eventName = (eventId: string | null) => events.find((e) => e.id === eventId)?.name;

  const stats = {
    total: outfits.length,
    purchased: outfits.filter((o) => o.purchased).length,
    estimated: outfits.reduce((sum, o) => sum + (o.estimated_cost || 0), 0),
    spent: outfits.filter((o) => o.purchased).reduce((sum, o) => sum + (o.actual_cost || 0), 0),
  };

  if (loading) return <div className="text-center py-12 text-indigo-900/60 font-display italic">Loading outfits…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <SectionTitle eyebrow="Libaas · اللباس" title="Outfits & shopping"
          subtitle="Lehnga, sherwani, jewelry — track every purchase per event" />
        <button onClick={() => { setShowForm(!showForm); setEditingOutfit(null); setFormData(emptyForm); }}
          className="nk-btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /><span>Add Item</span>
        </button>
      </div>

      <GoldDivider className="w-full" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="nk-eyebrow">Items</p><p className="text-3xl font-display font-semibold text-indigo-900">{stats.total}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Purchased</p><p className="text-3xl font-display font-semibold text-emerald-500">{stats.purchased}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Estimated</p><p className="text-2xl font-display font-semibold text-indigo-900">{formatCurrency(stats.estimated)}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Spent</p><p className="text-2xl font-display font-semibold text-gold-700">{formatCurrency(stats.spent)}</p></Card>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">
            {editingOutfit ? 'Edit item' : 'Add new item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="nk-label">Item name *</label>
                <input type="text" value={formData.name} required className="nk-input"
                  placeholder="e.g., Bridal lehnga, Sherwani, Jhumkay"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">For</label>
                <input type="text" value={formData.for_person} className="nk-input" list="outfit-persons"
                  placeholder={`e.g., ${persons[0] || 'Bride'}`}
                  onChange={(e) => setFormData({ ...formData, for_person: e.target.value })} />
                <datalist id="outfit-persons">
                  {persons.map((p) => <option key={p} value={p} />)}
                </datalist>
              </div>
              <div>
                <label className="nk-label">Type</label>
                <select value={formData.item_type} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}>
                  {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="nk-label">For event</label>
                <select value={formData.event_id} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}>
                  <option value="">All / no specific event</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div>
                <label className="nk-label">Shop / designer</label>
                <input type="text" value={formData.shop} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, shop: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="nk-label">Estimated (₹)</label>
                  <input type="number" value={formData.estimated_cost} className="nk-input" min="0"
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })} />
                </div>
                <div>
                  <label className="nk-label">Actual (₹)</label>
                  <input type="number" value={formData.actual_cost} className="nk-input" min="0"
                    onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })} />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.purchased}
                onChange={(e) => setFormData({ ...formData, purchased: e.target.checked })}
                className="w-5 h-5 accent-gold-500" />
              <span className="text-sm text-indigo-900">Purchased</span>
            </label>
            <div>
              <label className="nk-label">Notes</label>
              <textarea value={formData.notes} className="nk-input" rows={2}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="nk-btn-primary flex-1">{editingOutfit ? 'Save Item' : 'Add Item'}</button>
              <button type="button" onClick={resetForm} className="nk-btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {outfits.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <p className="text-indigo-900/50 font-display italic">
                Nothing here yet. Track lehngas, sherwanis, jewelry and more — per person and per event.
              </p>
            </Card>
          </div>
        ) : outfits.map((outfit) => {
          const evName = eventName(outfit.event_id);
          return (
            <Card key={outfit.id} className={`p-6 hover:shadow-gold-glow transition-shadow ${outfit.purchased ? 'opacity-75' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={`text-xl font-display font-semibold text-indigo-900 ${outfit.purchased ? 'line-through text-indigo-900/50' : ''}`}>
                    {outfit.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="nk-chip bg-ivory-200 text-indigo-900/70">{outfit.item_type}</span>
                    {outfit.for_person && <span className="nk-chip bg-indigo-100 text-indigo-700">{outfit.for_person}</span>}
                    {evName && <span className="nk-chip bg-gold-100 text-gold-700">{evName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(outfit)} className="text-gold-600 hover:text-gold-700 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteOutfit(outfit.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {outfit.shop && (
                <div className="flex items-center text-sm text-indigo-900/60 mb-3">
                  <Store className="w-3.5 h-3.5 mr-2 text-gold-500" />{outfit.shop}
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div>
                  {outfit.estimated_cost > 0 && (
                    <p className="text-xs text-indigo-900/50">Est: {formatCurrency(outfit.estimated_cost)}</p>
                  )}
                  {outfit.actual_cost > 0 && (
                    <p className="font-display font-semibold text-indigo-900">{formatCurrency(outfit.actual_cost)}</p>
                  )}
                </div>
                <button onClick={() => togglePurchased(outfit.id, outfit.purchased)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                    outfit.purchased ? 'bg-emerald-100 text-emerald-600' : 'bg-ivory-200 text-indigo-900/60 hover:bg-emerald-50'}`}>
                  <Check className="w-3.5 h-3.5" />
                  <span>{outfit.purchased ? 'Purchased' : 'To buy'}</span>
                </button>
              </div>

              {outfit.notes && (
                <div className="pt-3 border-t border-gold-300/25">
                  <p className="text-xs text-indigo-900/55">{outfit.notes}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
