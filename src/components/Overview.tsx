import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Heart } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { Bismillah, GoldDivider, Stat, Card } from './_nikahly';

type Wedding = Database['public']['Tables']['weddings']['Row'];

interface OverviewProps { wedding: Wedding; }
interface Stats {
  totalGuests: number; confirmedGuests: number; totalSpent: number;
  vendorCount: number; completedTasks: number; totalTasks: number;
}

export function Overview({ wedding }: OverviewProps) {
  const [stats, setStats] = useState<Stats>({
    totalGuests: 0, confirmedGuests: 0, totalSpent: 0,
    vendorCount: 0, completedTasks: 0, totalTasks: 0,
  });

  useEffect(() => { loadStats(); }, [wedding.id]);

  const loadStats = async () => {
    const [guestsResult, budgetResult, vendorsResult, checklistResult] = await Promise.all([
      supabase.from('guests').select('rsvp_status', { count: 'exact' }).eq('wedding_id', wedding.id),
      supabase.from('budget_items').select('actual_cost').eq('wedding_id', wedding.id),
      supabase.from('vendors').select('id', { count: 'exact' }).eq('wedding_id', wedding.id),
      supabase.from('checklist_items').select('completed', { count: 'exact' }).eq('wedding_id', wedding.id),
    ]);
    const totalGuests = guestsResult.count || 0;
    const confirmedGuests = guestsResult.data?.filter((g) => g.rsvp_status === 'accepted').length || 0;
    const totalSpent = budgetResult.data?.reduce((sum, item) => sum + (item.actual_cost || 0), 0) || 0;
    const vendorCount = vendorsResult.count || 0;
    const totalTasks = checklistResult.count || 0;
    const completedTasks = checklistResult.data?.filter((t) => t.completed).length || 0;
    setStats({ totalGuests, confirmedGuests, totalSpent, vendorCount, completedTasks, totalTasks });
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const daysUntilWedding = wedding.wedding_date
    ? Math.ceil((new Date(wedding.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-8">
      {/* Hero card — midnight indigo with gold jali */}
      <div className="bg-jali-on-indigo rounded-3xl p-10 text-ivory-50 relative overflow-hidden border border-gold-700/30">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 100% 0%, rgba(201,168,76,0.22), transparent 60%)' }}/>
        <div className="relative">
          <Bismillah className="!text-base mb-4 text-left" />
          <p className="nk-eyebrow mb-3">In sha Allah</p>
          <h2 className="text-5xl md:text-6xl font-display font-semibold mb-2 leading-tight">
            {wedding.partner1_name} <span className="text-gold-500 italic">&</span> {wedding.partner2_name}
          </h2>
          <GoldDivider className="w-48 my-5" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gold-500 mt-1" />
              <div>
                <p className="nk-eyebrow text-gold-500/80">Date</p>
                <p className="font-display text-xl">{formatDate(wedding.wedding_date)}</p>
              </div>
            </div>
            {daysUntilWedding !== null && daysUntilWedding > 0 && (
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-gold-500 mt-1" />
                <div>
                  <p className="nk-eyebrow text-gold-500/80">Days remaining</p>
                  <p className="font-display text-3xl text-gold-300">{daysUntilWedding}</p>
                </div>
              </div>
            )}
            {wedding.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-500 mt-1" />
                <div>
                  <p className="nk-eyebrow text-gold-500/80">Venue</p>
                  <p className="font-display text-xl">{wedding.venue}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat label="Guests confirmed"
              value={`${stats.confirmedGuests}/${stats.totalGuests}`}
              hint={`of ${wedding.guest_count_target} expected`} />
        <Card className="p-5">
          <div className="nk-eyebrow mb-2">Spent</div>
          <div className="text-3xl font-display font-semibold text-emerald-500">{formatCurrency(stats.totalSpent)}</div>
          <div className="text-xs text-indigo-900/55 mt-1">of {formatCurrency(wedding.total_budget)}</div>
          {wedding.total_budget > 0 && (
            <div className="mt-3 h-1.5 bg-ivory-300 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                style={{ width: `${Math.min((stats.totalSpent / wedding.total_budget) * 100, 100)}%` }}/>
            </div>
          )}
        </Card>
        <Stat label="Vendors" value={stats.vendorCount} hint="halal-friendly" tone="gold" />
        <Card className="p-5">
          <div className="nk-eyebrow mb-2">Tasks</div>
          <div className="text-3xl font-display font-semibold text-indigo-900">
            {stats.completedTasks}<span className="text-indigo-900/40">/{stats.totalTasks}</span>
          </div>
          {stats.totalTasks > 0 && (
            <div className="mt-3 h-1.5 bg-ivory-300 rounded-full overflow-hidden">
              <div className="h-full bg-gold-500 transition-all"
                style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}/>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
