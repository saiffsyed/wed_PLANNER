import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Mail, Phone, Check, X, Clock, UserPlus, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Guest = Database['public']['Tables']['guests']['Row'];

interface GuestsProps {
  weddingId: string;
}

export function Guests({ weddingId }: GuestsProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plus_one: false,
    dietary_restrictions: '',
    notes: '',
  });

  useEffect(() => {
    loadGuests();
  }, [weddingId]);

  const loadGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (err) {
      console.error('Error loading guests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('guests').insert({
        wedding_id: weddingId,
        ...formData,
      });

      if (error) throw error;
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', plus_one: false, dietary_restrictions: '', notes: '' });
      loadGuests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add guest');
    }
  };

  const updateRSVP = async (guestId: string, status: 'pending' | 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ rsvp_status: status })
        .eq('id', guestId);

      if (error) throw error;
      loadGuests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update RSVP');
    }
  };

  const deleteGuest = async (guestId: string) => {
    if (!confirm('Are you sure you want to remove this guest?')) return;
    try {
      const { error } = await supabase.from('guests').delete().eq('id', guestId);
      if (error) throw error;
      loadGuests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete guest');
    }
  };

  const getRSVPIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="w-4 h-4" />;
      case 'declined':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getRSVPColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const stats = {
    total: guests.length,
    accepted: guests.filter((g) => g.rsvp_status === 'accepted').length,
    declined: guests.filter((g) => g.rsvp_status === 'declined').length,
    pending: guests.filter((g) => g.rsvp_status === 'pending').length,
  };

  if (loading) {
    return <div className="text-center py-12">Loading guests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Guest List</h2>
          <p className="text-gray-600 mt-1">Manage your wedding guests and track RSVPs</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Guest</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Total Guests</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Declined</p>
          <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Guest</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Plus One</label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.plus_one}
                    onChange={(e) => setFormData({ ...formData, plus_one: e.target.checked })}
                    className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700">Allow plus one</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
              <input
                type="text"
                value={formData.dietary_restrictions}
                onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                placeholder="e.g., Vegetarian, Vegan, Gluten-free"
              />
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
                Add Guest
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RSVP Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No guests yet. Click "Add Guest" to get started.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">{guest.name}</div>
                          {guest.plus_one && (
                            <div className="flex items-center text-xs text-gray-500">
                              <UserPlus className="w-3 h-3 mr-1" />
                              Plus one
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        {guest.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-3 h-3 mr-2" />
                            {guest.email}
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-3 h-3 mr-2" />
                            {guest.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateRSVP(guest.id, 'accepted')}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            guest.rsvp_status === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateRSVP(guest.id, 'declined')}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            guest.rsvp_status === 'declined'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateRSVP(guest.id, 'pending')}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            guest.rsvp_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {guest.dietary_restrictions && (
                          <div className="mb-1">
                            <span className="font-medium">Diet:</span> {guest.dietary_restrictions}
                          </div>
                        )}
                        {guest.notes && (
                          <div className="text-xs text-gray-500">{guest.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => deleteGuest(guest.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
