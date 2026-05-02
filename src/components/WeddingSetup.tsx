import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Crescent, Bismillah, GoldDivider } from './_nikahly';

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
    <div className="min-h-screen bg-ivory-100 bg-jali-on-ivory flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="nk-card p-10">
          <div className="text-center mb-8 flex flex-col items-center gap-3">
            <Crescent size={36} />
            <Bismillah className="!text-base" />
            <h1 className="text-4xl font-display font-semibold text-indigo-900">Begin your journey</h1>
            <p className="text-indigo-900/60 italic font-display">Let's set up your nikah details, in shaa Allah</p>
            <GoldDivider className="w-40 mt-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="nk-label">Partner 1 (Bride / Groom)</label>
                <input
                  type="text"
                  value={formData.partner1_name}
                  onChange={(e) => setFormData({ ...formData, partner1_name: e.target.value })}
                  className="nk-input"
                  required
                />
              </div>
              <div>
                <label className="nk-label">Partner 2 (Bride / Groom)</label>
                <input
                  type="text"
                  value={formData.partner2_name}
                  onChange={(e) => setFormData({ ...formData, partner2_name: e.target.value })}
                  className="nk-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="nk-label">Nikah date</label>
              <input
                type="date"
                value={formData.wedding_date}
                onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
                className="nk-input"
              />
            </div>

            <div>
              <label className="nk-label">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="nk-input"
                placeholder="Mosque, hall, or address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="nk-label">Total budget (₹)</label>
                <input
                  type="number"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                  className="nk-input"
                  min="0"
                />
              </div>
              <div>
                <label className="nk-label">Expected guests</label>
                <input
                  type="number"
                  value={formData.guest_count_target}
                  onChange={(e) => setFormData({ ...formData, guest_count_target: e.target.value })}
                  className="nk-input"
                  min="0"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="nk-btn-primary w-full">
              {loading ? 'Creating…' : 'Create wedding'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
