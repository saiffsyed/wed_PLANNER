import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Mail, Phone, Globe, FileCheck, IndianRupee, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Vendor = Database['public']['Tables']['vendors']['Row'];

interface VendorsProps {
  weddingId: string;
}

const VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Florist',
  'Music/DJ',
  'Makeup Artist',
  'Decoration',
  'Transportation',
  'Invitations',
  'Other',
];

export function Vendors({ weddingId }: VendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    cost: '',
    paid: false,
    contract_signed: false,
    notes: '',
  });

  useEffect(() => {
    loadVendors();
  }, [weddingId]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (err) {
      console.error('Error loading vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('vendors').insert({
        wedding_id: weddingId,
        name: formData.name,
        category: formData.category,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        cost: parseFloat(formData.cost) || 0,
        paid: formData.paid,
        contract_signed: formData.contract_signed,
        notes: formData.notes,
      });

      if (error) throw error;
      setShowForm(false);
      setFormData({
        name: '',
        category: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        cost: '',
        paid: false,
        contract_signed: false,
        notes: '',
      });
      loadVendors();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add vendor');
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Delete this vendor?')) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      if (error) throw error;
      loadVendors();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete vendor');
    }
  };

  const togglePaid = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ paid: !currentStatus })
        .eq('id', vendorId);

      if (error) throw error;
      loadVendors();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };

  const toggleContract = async (vendorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ contract_signed: !currentStatus })
        .eq('id', vendorId);

      if (error) throw error;
      loadVendors();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update contract status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalCost = vendors.reduce((sum, vendor) => sum + vendor.cost, 0);
  const paidCount = vendors.filter((v) => v.paid).length;
  const contractCount = vendors.filter((v) => v.contract_signed).length;

  if (loading) {
    return <div className="text-center py-12">Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendors</h2>
          <p className="text-gray-600 mt-1">Manage your wedding service providers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Total Vendors</p>
          <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Contracts Signed</p>
          <p className="text-2xl font-bold text-blue-600">{contractCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Vendor</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select category</option>
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost (₹)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  min="0"
                />
              </div>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paid}
                    onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                    className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700">Paid</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.contract_signed}
                    onChange={(e) => setFormData({ ...formData, contract_signed: e.target.checked })}
                    className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700">Contract Signed</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-rose-600 text-white py-2 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Add Vendor
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <p className="text-gray-500">No vendors yet. Click "Add Vendor" to get started.</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                  <p className="text-sm text-gray-600">{vendor.category}</p>
                </div>
                <button
                  onClick={() => deleteVendor(vendor.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {vendor.contact_name && (
                <p className="text-sm text-gray-700 mb-3">
                  <span className="font-medium">Contact:</span> {vendor.contact_name}
                </p>
              )}

              <div className="space-y-2 mb-4">
                {vendor.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <a href={`mailto:${vendor.email}`} className="hover:text-rose-600 transition-colors">
                      {vendor.email}
                    </a>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <a href={`tel:${vendor.phone}`} className="hover:text-rose-600 transition-colors">
                      {vendor.phone}
                    </a>
                  </div>
                )}
                {vendor.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-2" />
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-rose-600 transition-colors truncate"
                    >
                      {vendor.website}
                    </a>
                  </div>
                )}
              </div>

              {vendor.cost > 0 && (
                <div className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                  <IndianRupee className="w-5 h-5 mr-1" />
                  {formatCurrency(vendor.cost)}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => togglePaid(vendor.id, vendor.paid)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vendor.paid
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                  }`}
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>{vendor.paid ? 'Paid' : 'Unpaid'}</span>
                </button>
                <button
                  onClick={() => toggleContract(vendor.id, vendor.contract_signed)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vendor.contract_signed
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{vendor.contract_signed ? 'Signed' : 'Unsigned'}</span>
                </button>
              </div>

              {vendor.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">{vendor.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
