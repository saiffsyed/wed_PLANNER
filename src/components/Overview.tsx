import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { Bismillah, Card } from './_nikahly';

type Wedding = Database['public']['Tables']['weddings']['Row'];
type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
type BudgetItem = Database['public']['Tables']['budget_items']['Row'];

interface OverviewProps { wedding: Wedding; }
interface Stats {
  totalGuests: number; confirmedGuests: number;
  completedTasks: number; totalTasks: number;
}

const CEREMONIES = [
  { key: 'mehndi', label: 'Mehndi', arabic: 'الحنة', offset: -1, color: 'bg-rose-900/60 border-rose-500/40' },
  { key: 'nikah',  label: 'Nikah',  arabic: 'النكاح', offset: 0,  color: 'bg-gold-900/60 border-gold-500/60' },
  { key: 'walima', label: 'Walima', arabic: 'الوليمة', offset: 1,  color: 'bg-indigo-800/80 border-indigo-500/40' },
];

export function Overview({ wedding }: OverviewProps) {
  const [stats, setStats] = useState<Stats>({ totalGuests: 0, confirmedGuests: 0, completedTasks: 0, totalTasks: 0 });
  const [tasks, setTasks] = useState<ChecklistItem[]>([]);
  const [meherItem, setMeherItem] = useState<BudgetItem | null>(null);

  useEffect(() => { loadData(); }, [wedding.id]);

  const loadData = async () => {
    const [guestsRes, checklistRes, pendingTasksRes, meherRes] = await Promise.all([
      supabase.from('guests').select('rsvp_status', { count: 'exact' }).eq('wedding_id', wedding.id),
      supabase.from('checklist_items').select('completed', { count: 'exact' }).eq('wedding_id', wedding.id),
      supabase.from('checklist_items').select('*').eq('wedding_id', wedding.id).eq('completed', false).order('due_date', { ascending: true }).limit(5),
      supabase.from('budget_items').select('*').eq('wedding_id', wedding.id).ilike('name', '%meher%').limit(1),
    ]);

    setStats({
      totalGuests: guestsRes.count || 0,
      confirmedGuests: guestsRes.data?.filter((g) => g.rsvp_status === 'accepted').length || 0,
      completedTasks: checklistRes.data?.filter((t) => t.completed).length || 0,
      totalTasks: checklistRes.count || 0,
    });
    setTasks(pendingTasksRes.data || []);
    setMeherItem(meherRes.data?.[0] || null);
  };

  const daysUntil = wedding.wedding_date
    ? Math.ceil((new Date(wedding.wedding_date).getTime() - new Date().getTime()) / 86400000)
    : null;

  const formatDate = (d: string | null) => {
    if (!d) return 'Date TBD';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const getCeremonyDate = (offset: number) => {
    if (!wedding.wedding_date) return null;
    const d = new Date(wedding.wedding_date);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const priorityDot = (p: string) =>
    p === 'high' ? 'bg-rose-500' : p === 'medium' ? 'bg-gold-500' : 'bg-indigo-300';

  return (
    <div className="space-y-0 pb-2">
      {/* ── Hero header ── full-bleed, dark indigo */}
      <div className="bg-jali-on-indigo px-4 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 80% 0%, rgba(201,168,76,0.18), transparent 60%)' }} />

        <div className="relative">
          <Bismillah className="!text-sm mb-3 text-left opacity-80" />

          {/* Partner names + date badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-3xl font-display font-semibold text-ivory-50 leading-tight">
              {wedding.partner1_name}
              <span className="text-gold-500 italic mx-2">&</span>
              {wedding.partner2_name}
            </h2>
            {daysUntil !== null && daysUntil >= 0 && (
              <div className="flex-shrink-0 bg-gold-500/20 border border-gold-500/40 rounded-full px-3 py-1 text-center">
                <div className="text-gold-300 text-xs font-bold leading-none">{daysUntil}</div>
                <div className="text-gold-400/80 text-[9px] uppercase tracking-widest leading-none mt-0.5">days</div>
              </div>
            )}
          </div>

          {/* Date + venue */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-1.5 text-ivory-100/70 text-sm">
              <Calendar className="w-3.5 h-3.5 text-gold-500" />
              <span>{formatDate(wedding.wedding_date)}</span>
            </div>
            {wedding.venue && (
              <div className="flex items-center gap-1.5 text-ivory-100/70 text-sm">
                <MapPin className="w-3.5 h-3.5 text-gold-500" />
                <span>{wedding.venue}</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'DAYS', value: daysUntil !== null && daysUntil >= 0 ? daysUntil : '—' },
              { label: 'TASKS', value: `${stats.completedTasks}/${stats.totalTasks}` },
              { label: 'GUESTS', value: stats.confirmedGuests },
            ].map((s) => (
              <div key={s.label} className="bg-indigo-950/60 rounded-2xl py-3 text-center border border-gold-700/20">
                <div className="text-2xl font-display font-bold text-ivory-50">{s.value}</div>
                <div className="text-[9px] font-bold tracking-[0.12em] text-ivory-100/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Ceremony timeline ── */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-indigo-900/50">Ceremony Timeline</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {CEREMONIES.map((c) => {
            const isToday = c.offset === 0;
            return (
              <div key={c.key}
                className={`flex-shrink-0 snap-start w-36 rounded-2xl border p-4 ${
                  isToday
                    ? 'bg-indigo-900 border-gold-500/60'
                    : 'bg-ivory-100 border-gold-300/30'
                }`}>
                <div className={`text-xs font-bold tracking-widest uppercase mb-1 ${isToday ? 'text-gold-400' : 'text-indigo-900/40'}`}>
                  {c.offset === 0 ? 'Day · 0' : c.offset === -1 ? 'Day · −1' : 'Day · +1'}
                </div>
                <div className={`font-display text-xl font-semibold ${isToday ? 'text-ivory-50' : 'text-indigo-900'}`}>
                  {c.label}
                </div>
                <div className={`font-arabic text-sm mt-0.5 ${isToday ? 'text-gold-300/80' : 'text-indigo-900/40'}`}>
                  {c.arabic}
                </div>
                {getCeremonyDate(c.offset) && (
                  <div className={`text-xs mt-2 ${isToday ? 'text-ivory-100/60' : 'text-indigo-900/40'}`}>
                    {getCeremonyDate(c.offset)}
                  </div>
                )}
                {isToday && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                    <span className="text-[9px] font-bold tracking-widest text-gold-400 uppercase">The big day</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pending Tasks ── */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-indigo-900/50 mb-3">Upcoming Tasks</h3>
        {tasks.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-indigo-900/40 font-display italic">All tasks done. Masha'Allah!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="nk-card p-3.5 flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityDot(task.priority)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-900 truncate">{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-indigo-900/40 mt-0.5">
                      Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                {task.category && (
                  <span className="nk-chip bg-ivory-200 text-indigo-900/60 flex-shrink-0 text-[10px]">{task.category}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Meher tracker ── */}
      {meherItem && (
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-indigo-900/50 mb-3">Meher Tracker</h3>
          <Card className="p-5" accent>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-indigo-900/50 mb-0.5">Agreed Amount</p>
                <p className="text-2xl font-display font-semibold text-indigo-900">
                  {formatCurrency(meherItem.estimated_cost || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-900/50 mb-0.5">Paid</p>
                <p className="text-2xl font-display font-semibold text-emerald-500">
                  {formatCurrency(meherItem.actual_cost || 0)}
                </p>
              </div>
            </div>
            {(meherItem.estimated_cost || 0) > 0 && (
              <div className="h-2 bg-ivory-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all rounded-full"
                  style={{ width: `${Math.min(((meherItem.actual_cost || 0) / (meherItem.estimated_cost || 1)) * 100, 100)}%` }}
                />
              </div>
            )}
            {meherItem.notes && (
              <p className="text-xs text-indigo-900/50 mt-3 pt-3 border-t border-gold-300/25">{meherItem.notes}</p>
            )}
          </Card>
        </div>
      )}

      {/* ── Budget snapshot ── */}
      <div className="px-4 pt-4 pb-6">
        <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-indigo-900/50 mb-3">Budget Snapshot</h3>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-indigo-900/60">Total budget</span>
            <span className="font-display font-semibold text-indigo-900">{formatCurrency(wedding.total_budget)}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-indigo-900/60">Guests expected</span>
            <span className="font-display font-semibold text-indigo-900">{wedding.guest_count_target}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-900/60">Confirmed</span>
            <span className="font-display font-semibold text-emerald-500">{stats.confirmedGuests} / {stats.totalGuests}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
