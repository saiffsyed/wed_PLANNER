import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Mail, Phone, Check, X, Clock, UserPlus, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { SectionTitle, Card, GoldDivider } from './_nikahly';

type GuestRow = Database['public']['Tables']['guests']['Row'];
type Guest = GuestRow & { gender?: 'men' | 'women' | 'mixed' };

interface GuestsProps { weddingId: string; }

export function Guests({ weddingId }: GuestsProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hall, setHall] = useState<'all' | 'men' | 'women' | 'mixed'>('all');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', plus_one: false,
    dietary_restrictions: '', notes: '', gender: 'mixed' as 'men' | 'women' | 'mixed',
  });

  useEffect(() => { loadGuests(); }, [weddingId]);

  const loadGuests = async () => {
    try {
      const { data, error } = await supabase.from('guests').select('*')
        .eq('wedding_id', weddingId).order('created_at', { ascending: false });
      if (error) throw error;
      setGuests((data || []) as Guest[]);
    } catch (err) { console.error('Error loading guests:', err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { gender, ...rest } = formData;
      const notesWithGender = gender !== 'mixed'
        ? `[hall:${gender}]${rest.notes ? ' ' + rest.notes : ''}`
        : rest.notes;
      const { error } = await supabase.from('guests').insert({
        wedding_id: weddingId, ...rest, notes: notesWithGender,
      });
      if (error) throw error;
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', plus_one: false, dietary_restrictions: '', notes: '', gender: 'mixed' });
      loadGuests();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to add guest'); }
  };

  const updateRSVP = async (guestId: string, status: 'pending' | 'accepted' | 'declined') => {
    try {
      const { error } = await supabase.from('guests').update({ rsvp_status: status }).eq('id', guestId);
      if (error) throw error;
      loadGuests();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update RSVP'); }
  };

  const deleteGuest = async (guestId: string) => {
    if (!confirm('Remove this guest?')) return;
    try {
      const { error } = await supabase.from('guests').delete().eq('id', guestId);
      if (error) throw error;
      loadGuests();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete guest'); }
  };

  const getGender = (guest: Guest): 'men' | 'women' | 'mixed' => {
    if (guest.notes?.startsWith('[hall:men]')) return 'men';
    if (guest.notes?.startsWith('[hall:women]')) return 'women';
    return 'mixed';
  };

  const filtered = hall === 'all' ? guests : guests.filter((g) => getGender(g) === hall);
  const stats = {
    total: guests.length,
    accepted: guests.filter((g) => g.rsvp_status === 'accepted').length,
    declined: guests.filter((g) => g.rsvp_status === 'declined').length,
    pending: guests.filter((g) => g.rsvp_status === 'pending').length,
    men: guests.filter((g) => getGender(g) === 'men').length,
    women: guests.filter((g) => getGender(g) === 'women').length,
  };

  if (loading) return <div className="text-center py-12 text-indigo-900/60 font-display italic">Loading guests…</div>;

  const hallTabs: { id: typeof hall; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'men', label: "Men's hall", count: stats.men },
    { id: 'women', label: "Women's hall", count: stats.women },
    { id: 'mixed', label: 'Mixed', count: guests.filter((g) => getGender(g) === 'mixed').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <SectionTitle eyebrow="Mehmaan · المهمان" title="Guest list"
          subtitle="Manage invitees, RSVPs and hall assignments" />
        <button onClick={() => setShowForm(!showForm)} className="nk-btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /><span>Add guest</span>
        </button>
      </div>

      <GoldDivider className="w-full" />

      <div className="flex flex-wrap gap-2">
        {hallTabs.map((t) => (
          <button key={t.id} onClick={() => setHall(t.id)}
            className={`nk-tab ${hall === t.id ? 'nk-tab-active' : ''}`}>
            <span>{t.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              hall === t.id ? 'bg-gold-500/20 text-gold-500' : 'bg-indigo-900/10'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="nk-eyebrow">Total</p><p className="text-3xl font-display font-semibold text-indigo-900">{stats.total}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Accepted</p><p className="text-3xl font-display font-semibold text-emerald-500">{stats.accepted}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Declined</p><p className="text-3xl font-display font-semibold text-rose-500">{stats.declined}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Pending</p><p className="text-3xl font-display font-semibold text-gold-700">{stats.pending}</p></Card>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">Add new guest</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="nk-label">Name *</label>
                <input type="text" value={formData.name} required className="nk-input"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Hall assignment</label>
                <div className="flex gap-2">
                  {(['men', 'women', 'mixed'] as const).map((g) => (
                    <button type="button" key={g} onClick={() => setFormData({ ...formData, gender: g })}
                      className={`flex-1 px-3 py-2 rounded-full text-sm font-semibold border transition-colors ${
                        formData.gender === g
                          ? 'bg-indigo-900 text-gold-500 border-indigo-900'
                          : 'bg-ivory-50 text-indigo-900 border-indigo-900/15'}`}>
                      {g === 'men' ? "Men's" : g === 'women' ? "Women's" : 'Mixed'}
                    </button>
                  ))}
                </div>
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
            </div>
            <div>
              <label className="nk-label">Dietary restrictions</label>
              <input type="text" value={formData.dietary_restrictions} className="nk-input"
                placeholder="Halal preference, vegetarian, allergies"
                onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })} />
            </div>
            <div>
              <label className="nk-label">Notes</label>
              <textarea value={formData.notes} className="nk-input" rows={3}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.plus_one}
                onChange={(e) => setFormData({ ...formData, plus_one: e.target.checked })}
                className="w-5 h-5 accent-gold-500" />
              <span className="text-sm text-indigo-900">Allow plus one</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="nk-btn-primary flex-1">Add guest</button>
              <button type="button" onClick={() => setShowForm(false)} className="nk-btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ivory-200 border-b border-gold-300/40">
              <tr>
                <th className="px-6 py-3 text-left nk-eyebrow">Name</th>
                <th className="px-6 py-3 text-left nk-eyebrow">Hall</th>
                <th className="px-6 py-3 text-left nk-eyebrow">Contact</th>
                <th className="px-6 py-3 text-left nk-eyebrow">RSVP</th>
                <th className="px-6 py-3 text-right nk-eyebrow">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-300/20">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-indigo-900/50 font-display italic">
                  No guests in this hall yet.
                </td></tr>
              ) : filtered.map((guest) => {
                const gender = getGender(guest);
                return (
                  <tr key={guest.id} className="hover:bg-ivory-200/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-indigo-900">{guest.name}</div>
                      {guest.plus_one && (
                        <div className="flex items-center text-xs text-indigo-900/55 mt-0.5">
                          <UserPlus className="w-3 h-3 mr-1" />Plus one
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`nk-chip ${
                        gender === 'men' ? 'bg-indigo-100 text-indigo-700' :
                        gender === 'women' ? 'bg-rose-100 text-rose-700' :
                        'bg-ivory-300 text-indigo-900/70'}`}>
                        {gender === 'men' ? "Men's" : gender === 'women' ? "Women's" : 'Mixed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        {guest.email && (
                          <div className="flex items-center text-indigo-900/70">
                            <Mail className="w-3 h-3 mr-2" />{guest.email}
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center text-indigo-900/70">
                            <Phone className="w-3 h-3 mr-2" />{guest.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => updateRSVP(guest.id, 'accepted')}
                          className={`p-1.5 rounded-full transition ${guest.rsvp_status === 'accepted'
                            ? 'bg-emerald-500 text-ivory-50' : 'bg-ivory-200 text-indigo-900/60 hover:bg-emerald-100'}`}>
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => updateRSVP(guest.id, 'declined')}
                          className={`p-1.5 rounded-full transition ${guest.rsvp_status === 'declined'
                            ? 'bg-rose-500 text-ivory-50' : 'bg-ivory-200 text-indigo-900/60 hover:bg-rose-100'}`}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => updateRSVP(guest.id, 'pending')}
                          className={`p-1.5 rounded-full transition ${guest.rsvp_status === 'pending'
                            ? 'bg-gold-500 text-indigo-900' : 'bg-ivory-200 text-indigo-900/60 hover:bg-gold-100'}`}>
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteGuest(guest.id)}
                        className="text-rose-500 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
