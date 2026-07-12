import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, Clock, MapPin, Shirt, Users, Trash2, Pencil } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { SectionTitle, Card, GoldDivider } from './_nikahly';

type Event = Database['public']['Tables']['events']['Row'];
type Guest = Database['public']['Tables']['guests']['Row'];
type GuestEvent = Database['public']['Tables']['guest_events']['Row'];

interface EventsProps { weddingId: string; }

const emptyForm = { name: '', event_date: '', event_time: '', venue: '', dress_code: '', notes: '' };

export function Events({ weddingId }: EventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestEvents, setGuestEvents] = useState<GuestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { loadData(); }, [weddingId]);

  const loadData = async () => {
    try {
      const [eventsResult, guestsResult] = await Promise.all([
        supabase.from('events').select('*').eq('wedding_id', weddingId).order('event_date', { ascending: true }),
        supabase.from('guests').select('*').eq('wedding_id', weddingId),
      ]);
      if (eventsResult.error) throw eventsResult.error;
      if (guestsResult.error) throw guestsResult.error;
      setEvents(eventsResult.data || []);
      setGuests(guestsResult.data || []);

      const eventIds = (eventsResult.data || []).map((e) => e.id);
      if (eventIds.length > 0) {
        const { data, error } = await supabase.from('guest_events').select('*').in('event_id', eventIds);
        if (error) throw error;
        setGuestEvents(data || []);
      } else {
        setGuestEvents([]);
      }
    } catch (err) { console.error('Error loading events:', err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        event_date: formData.event_date || null,
        event_time: formData.event_time,
        venue: formData.venue,
        dress_code: formData.dress_code,
        notes: formData.notes,
      };
      if (editingEvent) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingEvent);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('events').insert({ wedding_id: weddingId, ...payload });
        if (error) throw error;
      }
      resetForm();
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save event'); }
  };

  const startEdit = (event: Event) => {
    setFormData({
      name: event.name,
      event_date: event.event_date || '',
      event_time: event.event_time || '',
      venue: event.venue || '',
      dress_code: event.dress_code || '',
      notes: event.notes || '',
    });
    setEditingEvent(event.id);
    setShowForm(true);
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event? Guest invitations for it will also be removed.')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete event'); }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Date not set';
    return new Date(date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const partySize = (guestId: string) => guests.find((g) => g.id === guestId)?.party_size || 1;

  const getEventStats = (eventId: string) => {
    const invitations = guestEvents.filter((ge) => ge.event_id === eventId);
    return {
      invited: invitations.reduce((sum, ge) => sum + partySize(ge.guest_id), 0),
      accepted: invitations.filter((ge) => ge.rsvp_status === 'accepted').reduce((sum, ge) => sum + partySize(ge.guest_id), 0),
      pending: invitations.filter((ge) => ge.rsvp_status === 'pending').reduce((sum, ge) => sum + partySize(ge.guest_id), 0),
    };
  };

  if (loading) return <div className="text-center py-12 text-indigo-900/60 font-display italic">Loading events…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <SectionTitle eyebrow="Taqreebat · المناسبات" title="Events & functions"
          subtitle="Nikah, Mehndi, Baraat, Walima — plan every function" />
        <button onClick={() => { setShowForm(!showForm); setEditingEvent(null); setFormData(emptyForm); }}
          className="nk-btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /><span>Add Event</span>
        </button>
      </div>

      <GoldDivider className="w-full" />

      {showForm && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-semibold text-indigo-900 mb-4">
            {editingEvent ? 'Edit event' : 'Add new event'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="nk-label">Event name *</label>
                <input type="text" value={formData.name} required className="nk-input"
                  placeholder="e.g., Nikah, Mehndi, Baraat, Walima"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Venue</label>
                <input type="text" value={formData.venue} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Date</label>
                <input type="date" value={formData.event_date} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Time</label>
                <input type="time" value={formData.event_time} className="nk-input"
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })} />
              </div>
              <div>
                <label className="nk-label">Dress code / theme</label>
                <input type="text" value={formData.dress_code} className="nk-input"
                  placeholder="e.g., Yellow & green, Formal"
                  onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="nk-label">Notes</label>
              <textarea value={formData.notes} className="nk-input" rows={2}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="nk-btn-primary flex-1">{editingEvent ? 'Save Event' : 'Add Event'}</button>
              <button type="button" onClick={resetForm} className="nk-btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-indigo-900/50 font-display italic">
            No events yet. Add your functions — Nikah, Mehndi, Baraat, Walima — to plan guests, budget and vendors per event.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((event) => {
            const stats = getEventStats(event.id);
            return (
              <Card key={event.id} className="p-6 hover:shadow-gold-glow transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-display font-semibold text-indigo-900">{event.name}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(event)} className="text-gold-600 hover:text-gold-700 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteEvent(event.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center text-sm text-indigo-900/70">
                    <Calendar className="w-3.5 h-3.5 mr-2 text-gold-500" />
                    {formatDate(event.event_date)}
                  </div>
                  {event.event_time && (
                    <div className="flex items-center text-sm text-indigo-900/70">
                      <Clock className="w-3.5 h-3.5 mr-2 text-gold-500" />
                      {event.event_time}
                    </div>
                  )}
                  {event.venue && (
                    <div className="flex items-center text-sm text-indigo-900/70">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-gold-500" />
                      {event.venue}
                    </div>
                  )}
                  {event.dress_code && (
                    <div className="flex items-center text-sm text-indigo-900/70">
                      <Shirt className="w-3.5 h-3.5 mr-2 text-gold-500" />
                      {event.dress_code}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gold-300/25">
                  <div className="text-center">
                    <p className="text-2xl font-display font-semibold text-indigo-900">{stats.invited}</p>
                    <p className="text-xs text-indigo-900/55 flex items-center justify-center">
                      <Users className="w-3 h-3 mr-1" />Invited
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-semibold text-emerald-500">{stats.accepted}</p>
                    <p className="text-xs text-indigo-900/55">Accepted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display font-semibold text-gold-700">{stats.pending}</p>
                    <p className="text-xs text-indigo-900/55">Pending</p>
                  </div>
                </div>

                {event.notes && (
                  <div className="mt-3 pt-3 border-t border-gold-300/25">
                    <p className="text-xs text-indigo-900/55">{event.notes}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
