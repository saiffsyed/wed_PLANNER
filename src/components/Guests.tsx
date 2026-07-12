import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Mail, Phone, Check, X, Clock, Users, Trash2, Pencil } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { SectionTitle, Card, GoldDivider } from './_nikahly';

type Guest = Database['public']['Tables']['guests']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type GuestEvent = Database['public']['Tables']['guest_events']['Row'];
type RsvpStatus = 'pending' | 'accepted' | 'declined';
type Hall = 'men' | 'women' | 'mixed';
type Side = 'bride' | 'groom' | 'mutual';

interface GuestsProps { weddingId: string; }

const NEXT_RSVP: Record<RsvpStatus, RsvpStatus> = {
  pending: 'accepted',
  accepted: 'declined',
  declined: 'pending',
};

const SIDES: { value: Side; label: string }[] = [
  { value: 'bride', label: "Bride's side" },
  { value: 'groom', label: "Groom's side" },
  { value: 'mutual', label: 'Mutual' },
];

const emptyForm = {
  name: '', email: '', phone: '',
  side: 'mutual' as Side, party_size: '1', hall: 'mixed' as Hall,
  dietary_restrictions: '', notes: '',
  invitedEventIds: [] as string[],
};

export function Guests({ weddingId }: GuestsProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [guestEvents, setGuestEvents] = useState<GuestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<string | null>(null);
  const [hall, setHall] = useState<'all' | Hall>('all');
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { loadData(); }, [weddingId]);

  const loadData = async () => {
    try {
      const [guestsResult, eventsResult] = await Promise.all([
        supabase.from('guests').select('*').eq('wedding_id', weddingId).order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('wedding_id', weddingId).order('event_date', { ascending: true }),
      ]);
      if (guestsResult.error) throw guestsResult.error;
      if (eventsResult.error) throw eventsResult.error;
      setGuests(guestsResult.data || []);
      setEvents(eventsResult.data || []);

      const eventIds = (eventsResult.data || []).map((e) => e.id);
      if (eventIds.length > 0) {
        const { data, error } = await supabase.from('guest_events').select('*').in('event_id', eventIds);
        if (error) throw error;
        setGuestEvents(data || []);
      } else {
        setGuestEvents([]);
      }
    } catch (err) { console.error('Error loading guests:', err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingGuest(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        side: formData.side,
        party_size: Math.max(parseInt(formData.party_size) || 1, 1),
        hall: formData.hall,
        dietary_restrictions: formData.dietary_restrictions,
        notes: formData.notes,
      };

      let guestId = editingGuest;
      if (editingGuest) {
        const { error } = await supabase.from('guests').update(payload).eq('id', editingGuest);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('guests')
          .insert({ wedding_id: weddingId, ...payload }).select('id').single();
        if (error) throw error;
        guestId = data.id;
      }

      // Sync per-event invitations
      const currentEventIds = guestEvents.filter((ge) => ge.guest_id === guestId).map((ge) => ge.event_id);
      const toAdd = formData.invitedEventIds.filter((id) => !currentEventIds.includes(id));
      const toRemove = currentEventIds.filter((id) => !formData.invitedEventIds.includes(id));
      if (toAdd.length > 0) {
        const { error } = await supabase.from('guest_events')
          .insert(toAdd.map((event_id) => ({ guest_id: guestId!, event_id })));
        if (error) throw error;
      }
      if (toRemove.length > 0) {
        const { error } = await supabase.from('guest_events')
          .delete().eq('guest_id', guestId!).in('event_id', toRemove);
        if (error) throw error;
      }

      resetForm();
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save guest'); }
  };

  const startEdit = (guest: Guest) => {
    setFormData({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      side: guest.side || 'mutual',
      party_size: (guest.party_size || 1).toString(),
      hall: guest.hall || 'mixed',
      dietary_restrictions: guest.dietary_restrictions || '',
      notes: guest.notes || '',
      invitedEventIds: guestEvents.filter((ge) => ge.guest_id === guest.id).map((ge) => ge.event_id),
    });
    setEditingGuest(guest.id);
    setShowForm(true);
  };

  const updateRSVP = async (guestId: string, status: RsvpStatus) => {
    try {
      const { error } = await supabase.from('guests').update({ rsvp_status: status }).eq('id', guestId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update RSVP'); }
  };

  const cycleEventRSVP = async (guestEvent: GuestEvent) => {
    try {
      const { error } = await supabase.from('guest_events')
        .update({ rsvp_status: NEXT_RSVP[guestEvent.rsvp_status] }).eq('id', guestEvent.id);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to update event RSVP'); }
  };

  const deleteGuest = async (guestId: string) => {
    if (!confirm('Remove this guest?')) return;
    try {
      const { error } = await supabase.from('guests').delete().eq('id', guestId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete guest'); }
  };

  const toggleInvitedEvent = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      invitedEventIds: prev.invitedEventIds.includes(eventId)
        ? prev.invitedEventIds.filter((id) => id !== eventId)
        : [...prev.invitedEventIds, eventId],
    }));
  };

  const headcount = (list: Guest[]) => list.reduce((sum, g) => sum + (g.party_size || 1), 0);
  const guestHall = (g: Guest): Hall => g.hall || 'mixed';

  const filtered = hall === 'all' ? guests : guests.filter((g) => guestHall(g) === hall);
  const stats = {
    total: headcount(guests),
    accepted: headcount(guests.filter((g) => g.rsvp_status === 'accepted')),
    declined: headcount(guests.filter((g) => g.rsvp_status === 'declined')),
    pending: headcount(guests.filter((g) => g.rsvp_status === 'pending')),
    men: headcount(guests.filter((g) => guestHall(g) === 'men')),
    women: headcount(guests.filter((g) => guestHall(g) === 'women')),
    mixed: headcount(guests.filter((g) => guestHall(g) === 'mixed')),
  };

  const sideChip = (side: Side) =>
    side === 'bride' ? 'bg-rose-100 text-rose-700' :
    side === 'groom' ? 'bg-indigo-100 text-indigo-700' :
    'bg-ivory-300 text-indigo-900/70';

  const sideLabel = (side: Side) => SIDES.find((s) => s.value === side)?.label || 'Mutual';

  const eventChip = (status: RsvpStatus) =>
    status === 'accepted' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
    status === 'declined' ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' :
    'bg-gold-100 text-gold-700 hover:bg-gold-200';

  if (loading) return <div className="text-center py-12 text-indigo-900/60 font-display italic">Loading guests…</div>;

  const hallTabs: { id: typeof hall; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'men', label: "Men's hall", count: stats.men },
    { id: 'women', label: "Women's hall", count: stats.women },
    { id: 'mixed', label: 'Mixed', count: stats.mixed },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <SectionTitle eyebrow="Mehmaan · المهمان" title="Guest list"
          subtitle="Families, per-event invites, RSVPs and hall assignments" />
        <button onClick={() => { setShowForm(!showForm); setEditingGuest(null); setFormData(emptyForm); }}
          className="nk-btn-primary flex items-center gap-2 self-start">
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
        <Card className="p-4"><p className="nk-eyebrow">Total people</p><p className="text-3xl font-display font-semibold text-indigo-900">{stats.total}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Accepted</p><p className="text-3xl font-display font-semibold text-emerald-500">{stats.accepted}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Declined</p><p className="text-3xl font-display font-semibold text-rose-500">{stats.declined}</p></Card>
        <Card className="p-4"><p className="nk-eyebrow">Pending</p><p className="text-3xl font-display font-semibold text-gold-700">{stats.pending}</p></Card>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">
            {editingGuest ? 'Edit guest' : 'Add new guest'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="nk-label">Name / family *</label>
                <input type="text" value={formData.name} required className="nk-input"
                  placeholder="e.g., Ahmed Bhai's family"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="nk-label">Side</label>
                  <select value={formData.side} className="nk-input"
                    onChange={(e) => setFormData({ ...formData, side: e.target.value as Side })}>
                    {SIDES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="nk-label">No. of people</label>
                  <input type="number" value={formData.party_size} min="1" className="nk-input"
                    onChange={(e) => setFormData({ ...formData, party_size: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="nk-label">Hall assignment</label>
                <div className="flex gap-2">
                  {(['men', 'women', 'mixed'] as const).map((g) => (
                    <button type="button" key={g} onClick={() => setFormData({ ...formData, hall: g })}
                      className={`flex-1 px-3 py-2 rounded-full text-sm font-semibold border transition-colors ${
                        formData.hall === g
                          ? 'bg-indigo-900 text-gold-500 border-indigo-900'
                          : 'bg-ivory-50 text-indigo-900 border-indigo-900/15'}`}>
                      {g === 'men' ? "Men's" : g === 'women' ? "Women's" : 'Mixed'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="nk-label">Phone</label>
                <input type="tel" value={formData.phone} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Email</label>
                <input type="email" value={formData.email} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            {events.length > 0 && (
              <div>
                <label className="nk-label">Invited to events</label>
                <div className="flex flex-wrap gap-2">
                  {events.map((event) => (
                    <button key={event.id} type="button" onClick={() => toggleInvitedEvent(event.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                        formData.invitedEventIds.includes(event.id)
                          ? 'bg-indigo-900 text-gold-500 border-indigo-900'
                          : 'bg-ivory-50 text-indigo-900 border-indigo-900/15 hover:border-gold-500'}`}>
                      {event.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
            <div className="flex gap-3">
              <button type="submit" className="nk-btn-primary flex-1">{editingGuest ? 'Save guest' : 'Add guest'}</button>
              <button type="button" onClick={resetForm} className="nk-btn-ghost flex-1">Cancel</button>
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
                <th className="px-6 py-3 text-left nk-eyebrow">Events</th>
                <th className="px-6 py-3 text-right nk-eyebrow">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-300/20">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-indigo-900/50 font-display italic">
                  No guests in this hall yet.
                </td></tr>
              ) : filtered.map((guest) => {
                const gHall = guestHall(guest);
                const invitations = guestEvents.filter((ge) => ge.guest_id === guest.id);
                return (
                  <tr key={guest.id} className="hover:bg-ivory-200/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-indigo-900">{guest.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`nk-chip ${sideChip(guest.side || 'mutual')}`}>{sideLabel(guest.side || 'mutual')}</span>
                        <span className="flex items-center text-xs text-indigo-900/55">
                          <Users className="w-3 h-3 mr-1" />{guest.party_size || 1}
                        </span>
                      </div>
                      {guest.dietary_restrictions && (
                        <div className="text-xs text-indigo-900/50 mt-1">Diet: {guest.dietary_restrictions}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`nk-chip ${
                        gHall === 'men' ? 'bg-indigo-100 text-indigo-700' :
                        gHall === 'women' ? 'bg-rose-100 text-rose-700' :
                        'bg-ivory-300 text-indigo-900/70'}`}>
                        {gHall === 'men' ? "Men's" : gHall === 'women' ? "Women's" : 'Mixed'}
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
                    <td className="px-6 py-4">
                      {invitations.length === 0 ? (
                        <span className="text-xs text-indigo-900/40 italic">No events</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {invitations.map((ge) => {
                            const event = events.find((ev) => ev.id === ge.event_id);
                            if (!event) return null;
                            return (
                              <button key={ge.id} onClick={() => cycleEventRSVP(ge)}
                                title={`${event.name}: ${ge.rsvp_status} — click to change`}
                                className={`nk-chip transition-colors cursor-pointer ${eventChip(ge.rsvp_status)}`}>
                                {event.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => startEdit(guest)}
                          className="text-gold-600 hover:text-gold-700 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteGuest(guest.id)}
                          className="text-rose-500 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
