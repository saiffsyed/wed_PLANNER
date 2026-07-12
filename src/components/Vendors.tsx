import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Mail, Phone, Globe, FileCheck, IndianRupee, Trash2, Pencil, Check, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { SectionTitle, Card, GoldDivider } from './_nikahly';

type Vendor = Database['public']['Tables']['vendors']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type VendorPayment = Database['public']['Tables']['vendor_payments']['Row'];

interface VendorsProps { weddingId: string; }

const VENDOR_CATEGORIES = [
  'Venue', 'Catering (Halal)', 'Photography', 'Videography',
  'Mehndi Artist', 'Makeup Artist', 'Florist', 'Decoration',
  'Music/Nasheed', 'Transportation', 'Invitations', 'Other',
];

const emptyForm = {
  name: '', category: '', event_id: '', contact_name: '', email: '', phone: '',
  website: '', cost: '', paid: false, contract_signed: false, notes: '',
};

export function Vendors({ weddingId }: VendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [paymentForm, setPaymentForm] = useState({ amount: '', due_date: '' });

  useEffect(() => { loadData(); }, [weddingId]);

  const loadData = async () => {
    try {
      const [vendorsResult, eventsResult, paymentsResult] = await Promise.all([
        supabase.from('vendors').select('*').eq('wedding_id', weddingId).order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('wedding_id', weddingId).order('event_date', { ascending: true }),
        supabase.from('vendor_payments').select('*').eq('wedding_id', weddingId).order('due_date', { ascending: true }),
      ]);
      if (vendorsResult.error) throw vendorsResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;
      setVendors(vendorsResult.data || []);
      setEvents(eventsResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (err) { console.error('Error loading vendors:', err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingVendor(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name, category: formData.category,
        event_id: formData.event_id || null,
        contact_name: formData.contact_name, email: formData.email, phone: formData.phone,
        website: formData.website, cost: parseFloat(formData.cost) || 0,
        paid: formData.paid, contract_signed: formData.contract_signed, notes: formData.notes,
      };
      if (editingVendor) {
        const { error } = await supabase.from('vendors').update(payload).eq('id', editingVendor);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vendors').insert({ wedding_id: weddingId, ...payload });
        if (error) throw error;
      }
      resetForm();
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save vendor'); }
  };

  const startEdit = (vendor: Vendor) => {
    setFormData({
      name: vendor.name, category: vendor.category,
      event_id: vendor.event_id || '',
      contact_name: vendor.contact_name || '', email: vendor.email || '', phone: vendor.phone || '',
      website: vendor.website || '', cost: vendor.cost.toString(),
      paid: vendor.paid, contract_signed: vendor.contract_signed, notes: vendor.notes || '',
    });
    setEditingVendor(vendor.id);
    setShowForm(true);
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Delete this vendor? Its payment schedule will also be removed.')) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete vendor'); }
  };

  const togglePaid = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('vendors').update({ paid: !currentStatus }).eq('id', vendorId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update payment status'); }
  };

  const toggleContract = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('vendors').update({ contract_signed: !currentStatus }).eq('id', vendorId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update contract status'); }
  };

  const addPayment = async (vendorId: string) => {
    const amount = parseFloat(paymentForm.amount) || 0;
    if (amount <= 0) { alert('Enter a payment amount'); return; }
    try {
      const { error } = await supabase.from('vendor_payments').insert({
        vendor_id: vendorId, wedding_id: weddingId,
        amount, due_date: paymentForm.due_date || null,
      });
      if (error) throw error;
      setPaymentForm({ amount: '', due_date: '' });
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to add payment'); }
  };

  const togglePaymentPaid = async (payment: VendorPayment) => {
    try {
      const { error } = await supabase.from('vendor_payments').update({
        paid: !payment.paid,
        paid_date: !payment.paid ? new Date().toISOString().slice(0, 10) : null,
      }).eq('id', payment.id);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update payment'); }
  };

  const deletePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase.from('vendor_payments').delete().eq('id', paymentId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete payment'); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string | null) => {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const vendorPayments = (vendorId: string) => payments.filter((p) => p.vendor_id === vendorId);
  const vendorPaidTotal = (vendorId: string) =>
    vendorPayments(vendorId).filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const eventName = (eventId: string | null) => events.find((e) => e.id === eventId)?.name;

  const totalCost = vendors.reduce((sum, v) => sum + v.cost, 0);
  const paidCount = vendors.filter((v) => v.paid).length;
  const contractCount = vendors.filter((v) => v.contract_signed).length;
  const upcomingPayments = payments.filter((p) => !p.paid);
  const upcomingTotal = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="text-center py-12 text-indigo-900/60 font-display italic">Loading vendors…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <SectionTitle eyebrow="Khadamaat · الخدمات" title="Vendors" subtitle="Service providers and their payment schedules" />
        <button onClick={() => { setShowForm(!showForm); setEditingVendor(null); setFormData(emptyForm); }}
          className="nk-btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /><span>Add Vendor</span>
        </button>
      </div>

      <GoldDivider className="w-full" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="nk-eyebrow mb-2">Total vendors</div>
          <p className="text-4xl font-display font-semibold text-indigo-900">{vendors.length}</p>
          <p className="text-xs text-indigo-900/55 mt-1">{contractCount} contracts signed</p>
        </Card>
        <Card className="p-5">
          <div className="nk-eyebrow mb-2">Total cost</div>
          <p className="text-3xl font-display font-semibold text-indigo-900">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-indigo-900/55 mt-1">{paidCount} of {vendors.length} fully paid</p>
        </Card>
        <Card className="p-5">
          <div className="nk-eyebrow mb-2">Payments due</div>
          <p className="text-3xl font-display font-semibold text-rose-500">{formatCurrency(upcomingTotal)}</p>
          <p className="text-xs text-indigo-900/55 mt-1">{upcomingPayments.length} unpaid instalments</p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">
            {editingVendor ? 'Edit vendor' : 'Add new vendor'}
          </h3>
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
                <label className="nk-label">For event</label>
                <select value={formData.event_id} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}>
                  <option value="">All / no specific event</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
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
              <button type="submit" className="nk-btn-primary flex-1">{editingVendor ? 'Save Vendor' : 'Add Vendor'}</button>
              <button type="button" onClick={resetForm} className="nk-btn-ghost flex-1">Cancel</button>
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
        ) : vendors.map((vendor) => {
          const vPayments = vendorPayments(vendor.id);
          const paidTotal = vendorPaidTotal(vendor.id);
          const expanded = expandedVendor === vendor.id;
          const evName = eventName(vendor.event_id);
          return (
            <Card key={vendor.id} className="p-6 hover:shadow-gold-glow transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-display font-semibold text-indigo-900">{vendor.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="nk-chip bg-ivory-200 text-indigo-900/70">{vendor.category}</span>
                    {evName && <span className="nk-chip bg-gold-100 text-gold-700">{evName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(vendor)} className="text-gold-600 hover:text-gold-700 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteVendor(vendor.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center text-lg font-display font-semibold text-indigo-900">
                      <IndianRupee className="w-4 h-4 mr-1" />{formatCurrency(vendor.cost)}
                    </span>
                    {vPayments.length > 0 && (
                      <span className="text-xs text-indigo-900/55">{formatCurrency(paidTotal)} paid</span>
                    )}
                  </div>
                  {vPayments.length > 0 && (
                    <div className="h-1.5 bg-ivory-300 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                        style={{ width: `${Math.min((paidTotal / vendor.cost) * 100, 100)}%` }} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mb-3">
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

              <button
                onClick={() => { setExpandedVendor(expanded ? null : vendor.id); setPaymentForm({ amount: '', due_date: '' }); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-full text-sm font-semibold bg-ivory-200 text-indigo-900/70 hover:bg-gold-100 transition-colors">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Payment schedule ({vPayments.length})
                </span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expanded && (
                <div className="mt-3 space-y-2">
                  {vPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2.5 bg-ivory-100 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => togglePaymentPaid(payment)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            payment.paid ? 'bg-emerald-500 border-emerald-500' : 'border-indigo-900/25 hover:border-emerald-500'}`}>
                          {payment.paid && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold ${payment.paid ? 'line-through text-indigo-900/40' : 'text-indigo-900'}`}>
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-indigo-900/50">
                            {payment.paid && payment.paid_date
                              ? `Paid ${formatDate(payment.paid_date)}`
                              : `Due ${formatDate(payment.due_date)}`}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => deletePayment(payment.id)}
                        className="text-rose-500 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <input type="number" min="0" placeholder="₹ Amount" value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="nk-input !py-1.5 text-sm flex-1" />
                    <input type="date" value={paymentForm.due_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                      className="nk-input !py-1.5 text-sm flex-1" />
                    <button onClick={() => addPayment(vendor.id)}
                      className="px-3 rounded-full bg-indigo-900 text-gold-500 hover:bg-indigo-800 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {vendor.notes && (
                <div className="mt-3 pt-3 border-t border-gold-300/25">
                  <p className="text-xs text-indigo-900/55">{vendor.notes}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
