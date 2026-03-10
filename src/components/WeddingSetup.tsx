import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WeddingSetupProps {
  onComplete: () => void;
}

export function WeddingSetup({ onComplete }: WeddingSetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partner1_name: '',
    partner2_name: '',
    wedding_date: '',
    venue: '',
    total_budget: '',
    guest_count_target: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('weddings').insert({
        user_id: user.id,
        partner1_name: formData.partner1_name,
        partner2_name: formData.partner2_name,
        wedding_date: formData.wedding_date || null,
        venue: formData.venue,
        total_budget: parseFloat(formData.total_budget) || 0,
        guest_count_target: parseInt(formData.guest_count_target) || 0,
      });

      if (error) throw error;
      onComplete();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create wedding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Wedding Planner</h1>
            <p className="text-gray-600">Let's start by setting up your wedding details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="partner1" className="block text-sm font-medium text-gray-700 mb-2">
                  Partner 1 Name
                </label>
                <input
                  id="partner1"
                  type="text"
                  value={formData.partner1_name}
                  onChange={(e) => setFormData({ ...formData, partner1_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="partner2" className="block text-sm font-medium text-gray-700 mb-2">
                  Partner 2 Name
                </label>
                <input
                  id="partner2"
                  type="text"
                  value={formData.partner2_name}
                  onChange={(e) => setFormData({ ...formData, partner2_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Wedding Date
              </label>
              <input
                id="date"
                type="date"
                value={formData.wedding_date}
                onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <input
                id="venue"
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter venue name or location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Budget (₹)
                </label>
                <input
                  id="budget"
                  type="number"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Guest Count
                </label>
                <input
                  id="guests"
                  type="number"
                  value={formData.guest_count_target}
                  onChange={(e) => setFormData({ ...formData, guest_count_target: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Wedding'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
