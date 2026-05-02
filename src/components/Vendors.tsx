import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Mail, Phone, Globe, FileCheck, IndianRupee, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { SectionTitle, Card, GoldDivider } from './_nikahly';

type Vendor = Database['public']['Tables']['vendors']['Row'];
interface VendorsProps { weddingId: string; }

const VENDOR_CATEGORIES = [
  'Venue', 'Catering (Halal)', 'Photography', 'Videography',
  'Mehndi Artist', 'Makeup Artist', 'Florist', 'Decoration',
  'Music/Nasheed', 'Transportation', 'Invitations', 'Other',
];

export function Vendors({ weddingId }: VendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', contact_name: '', email: '', phone: '',
    website: '', cost: '', paid: false, contract_signed: false, notes: '',
  });

  useEffect(() => { loadVendors(); }, [weddingId]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase.from('vendors').select('*')
        .eq('wedding_id', weddingId).order('created_at', { ascending: false });
      if (error) throw error;
      setVendors(data || []);
    } catch (err) { console.error('Error loading vendors:', err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('vendors').insert({
        wedding_id: weddingId, name: formData.name, category: formData.category,
        contact_name: formData.contact_name, email: formData.email, phone: formData.phone,
        website: formData.website, cost: parseFloat(formData.cost) || 0,
        paid: formData.paid, contract_signed: formData.contract_signed, notes: formData.notes,
      });
      if (error) throw error;
      setShowForm(false);
      setFormData({ name: '', category: '', contact_name: '', email: '', phone: '', website: '', cost: '', paid: false, contract_signed: false, notes: '' });
      loadVendors();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to add vendor'); }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Delete this vendor?')) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      if (error) throw error;
      loadVendors();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete vendor'); }
  };

  const togglePaid = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('vendors').update({ paid: !currentStatus }).eq('id', vendorId);
      if (error) throw error;
      loadVendors();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update payment status'); }
  };

  const toggleContract = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('vendors').update({ contract_signed: !currentStatus }).eq('id', vendorId);
      if (error) throw error;
      loadVendors();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update contract status'); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const totalCost = vendors.reduce((sum, v) => sum + v.cost, 0);
  const paidCount = vendors.filter((v) => v.paid).length;
  const contractCount = vendors.filter((v) => v.contract_signed).length;

  if (loading) return <div className="text-center py-12 text-indigo-900/60 font-display italic">Loading vendors…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <SectionTitle eyebrow="Khadamaat · الخدمات" title="Vendors" subtitle="Manage your wedding service providers" />
        <button onClick={() => setShowForm(!showForm)} className="nk-btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /><span>Add Vendor</span>
        </button>
      </div>

      <GoldDivider className="w-full" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="nk-eyebrow mb-2">Total vendors</div>
          <p className="text-4xl font-display font-semibold text-indigo-900">{vendors.length}</p>
        </Card>
        <Card className="p-5">
          <div className="nk-eyebrow mb-2">Contracts signed</div>
          <p className="text-4xl font-display font-semibold text-gold-700">{contractCount}</p>
        </Card>
        <Card className="p-5">
          <div className="nk-eyebrow mb-2">Total cost</div>
          <p className="text-3xl font-display font-semibold text-indigo-900">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-indigo-900/55 mt-1">{paidCount} of {vendors.length} paid</p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">Add new vendor</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="nk-label">Vendor name *</label>
                <input type="text" value={formData.name} required className="nk-input"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Category *</label>
                <select value={formData.category} required className="nk-input"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Select category</option>
                  {VENDOR_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="nk-label">Contact name</label>
                <input type="text" value={formData.contact_name} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Email</label>
                <input type="email" value={formData.email} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Phone</label>
                <input type="tel" value={formData.phone} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Website</label>
                <input type="url" value={formData.website} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Cost (₹)</label>
                <input type="number" value={formData.cost} className="nk-input" min="0"
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
              </div>
              <div className="flex items-end gap-6 pb-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.paid}
                    onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                    className="w-5 h-5 accent-gold-500" />
                  <span className="text-sm text-indigo-900">Paid</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.contract_signed}
                    onChange={(e) => setFormData({ ...formData, contract_signed: e.target.checked })}
                    className="w-5 h-5 accent-gold-500" />
                  <span className="text-sm text-indigo-900">Contract signed</span>
                </label>
              </div>
            </div>
            <div>
              <label className="nk-label">Notes</label>
              <textarea value={formData.notes} className="nk-input" rows={3}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="nk-btn-primary flex-1">Add Vendor</button>
              <button type="button" onClick={() => setShowForm(false)} className="nk-btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vendors.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <p className="text-indigo-900/50 font-display italic">No vendors yet. Click "Add Vendor" to get started.</p>
            </Card>
          </div>
        ) : vendors.map((vendor) => (
          <Card key={vendor.id} className="p-6 hover:shadow-gold-glow transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-display font-semibold text-indigo-900">{vendor.name}</h3>
                <span className="nk-chip bg-ivory-200 text-indigo-900/70 mt-1">{vendor.category}</span>
              </div>
              <button onClick={() => deleteVendor(vendor.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {vendor.contact_name && (
              <p className="text-sm text-indigo-900/70 mb-3">
                <span className="font-semibold">Contact:</span> {vendor.contact_name}
              </p>
            )}

            <div className="space-y-1.5 mb-4">
              {vendor.email && (
                <div className="flex items-center text-sm text-indigo-900/60">
                  <Mail className="w-3.5 h-3.5 mr-2 text-gold-500" />
                  <a href={`mailto:${vendor.email}`} className="hover:text-gold-700 transition-colors">{vendor.email}</a>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center text-sm text-indigo-900/60">
                  <Phone className="w-3.5 h-3.5 mr-2 text-gold-500" />
                  <a href={`tel:${vendor.phone}`} className="hover:text-gold-700 transition-colors">{vendor.phone}</a>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center text-sm text-indigo-900/60">
                  <Globe className="w-3.5 h-3.5 mr-2 text-gold-500" />
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                    className="hover:text-gold-700 transition-colors truncate">{vendor.website}</a>
                </div>
              )}
            </div>

            {vendor.cost > 0 && (
              <div className="flex items-center text-lg font-display font-semibold text-indigo-900 mb-3">
                <IndianRupee className="w-4 h-4 mr-1" />{formatCurrency(vendor.cost)}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => togglePaid(vendor.id, vendor.paid)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                  vendor.paid ? 'bg-emerald-100 text-emerald-600' : 'bg-ivory-200 text-indigo-900/60 hover:bg-emerald-50'}`}>
                <IndianRupee className="w-3.5 h-3.5" />
                <span>{vendor.paid ? 'Paid' : 'Unpaid'}</span>
              </button>
              <button onClick={() => toggleContract(vendor.id, vendor.contract_signed)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                  vendor.contract_signed ? 'bg-indigo-100 text-indigo-700' : 'bg-ivory-200 text-indigo-900/60 hover:bg-indigo-50'}`}>
                <FileCheck className="w-3.5 h-3.5" />
                <span>{vendor.contract_signed ? 'Signed' : 'Unsigned'}</span>
              </button>
            </div>

            {vendor.notes && (
              <div className="mt-3 pt-3 border-t border-gold-300/25">
                <p className="text-xs text-indigo-900/55">{vendor.notes}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
