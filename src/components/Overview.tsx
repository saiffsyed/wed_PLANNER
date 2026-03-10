import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, IndianRupee, Building2, CheckSquare } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Wedding = Database['public']['Tables']['weddings']['Row'];

interface OverviewProps {
  wedding: Wedding;
}

interface Stats {
  totalGuests: number;
  confirmedGuests: number;
  totalSpent: number;
  vendorCount: number;
  completedTasks: number;
  totalTasks: number;
}

export function Overview({ wedding }: OverviewProps) {
  const [stats, setStats] = useState<Stats>({
    totalGuests: 0,
    confirmedGuests: 0,
    totalSpent: 0,
    vendorCount: 0,
    completedTasks: 0,
    totalTasks: 0,
  });

  useEffect(() => {
    loadStats();
  }, [wedding.id]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const daysUntilWedding = wedding.wedding_date
    ? Math.ceil((new Date(wedding.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">
          {wedding.partner1_name} & {wedding.partner2_name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5" />
            <div>
              <p className="text-rose-100 text-sm">Wedding Date</p>
              <p className="font-semibold">{formatDate(wedding.wedding_date)}</p>
            </div>
          </div>
          {daysUntilWedding !== null && daysUntilWedding > 0 && (
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-rose-100 text-sm">Days Until Wedding</p>
                <p className="font-semibold text-2xl">{daysUntilWedding}</p>
              </div>
            </div>
          )}
          {wedding.venue && (
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5" />
              <div>
                <p className="text-rose-100 text-sm">Venue</p>
                <p className="font-semibold">{wedding.venue}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-rose-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Guest List</h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.confirmedGuests}/{stats.totalGuests}
          </p>
          <p className="text-sm text-gray-500">Confirmed out of {wedding.guest_count_target} expected</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <IndianRupee className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Budget</h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(stats.totalSpent)}</p>
          <p className="text-sm text-gray-500">of {formatCurrency(wedding.total_budget)} budget</p>
          {wedding.total_budget > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.totalSpent / wedding.total_budget) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Vendors</h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.vendorCount}</p>
          <p className="text-sm text-gray-500">Service providers</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <CheckSquare className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Checklist Progress</h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {stats.completedTasks}/{stats.totalTasks}
          </p>
          <p className="text-sm text-gray-500">Tasks completed</p>
          {stats.totalTasks > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
