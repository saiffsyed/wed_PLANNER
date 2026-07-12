import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWedding } from '../hooks/useWedding';
import { Home, Users, IndianRupee, Building2, CheckSquare, LogOut, CalendarDays, Shirt } from 'lucide-react';
import { Overview } from './Overview';
import { Events } from './Events';
import { Guests } from './Guests';
import { Budget } from './Budget';
import { Vendors } from './Vendors';
import { Outfits } from './Outfits';
import { Checklist } from './Checklist';
import { Crescent } from './_nikahly';

type Tab = 'overview' | 'events' | 'guests' | 'budget' | 'vendors' | 'outfits' | 'checklist';

export function Dashboard() {
  const { signOut } = useAuth();
  const { wedding } = useWedding();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Remember wedding info so the login screen can show a countdown
  useEffect(() => {
    if (wedding) {
      localStorage.setItem('nikahly_wedding_info', JSON.stringify({
        date: wedding.wedding_date,
        names: `${wedding.partner1_name} & ${wedding.partner2_name}`,
      }));
    }
  }, [wedding]);

  if (!wedding) return null;

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: Home },
    { id: 'events' as Tab, label: 'Events', icon: CalendarDays },
    { id: 'guests' as Tab, label: 'Guests', icon: Users },
    { id: 'budget' as Tab, label: 'Budget', icon: IndianRupee },
    { id: 'vendors' as Tab, label: 'Vendors', icon: Building2 },
    { id: 'outfits' as Tab, label: 'Outfits', icon: Shirt },
    { id: 'checklist' as Tab, label: 'Checklist', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-ivory-100">
      <nav className="bg-indigo-900 bg-jali-on-indigo border-b border-gold-700/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Crescent size={28} />
                <h1 className="text-xl font-display font-semibold text-ivory-50">
                  {wedding.partner1_name} <span className="text-gold-500 italic">&</span> {wedding.partner2_name}
                </h1>
              </div>
              <div className="hidden md:flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-gold-500 text-indigo-900'
                        : 'text-ivory-100/80 hover:text-gold-300 hover:bg-indigo-800/40'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-ivory-100/70 hover:text-gold-300 px-4 py-2 rounded-full hover:bg-indigo-800/40 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-ivory-50 border-b border-gold-300/30">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === tab.id
                  ? 'border-gold-500 text-indigo-900'
                  : 'border-transparent text-indigo-900/60'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'overview' && <Overview wedding={wedding} />}
        {activeTab === 'events' && <Events weddingId={wedding.id} />}
        {activeTab === 'guests' && <Guests weddingId={wedding.id} />}
        {activeTab === 'budget' && <Budget weddingId={wedding.id} />}
        {activeTab === 'vendors' && <Vendors weddingId={wedding.id} />}
        {activeTab === 'outfits' && <Outfits wedding={wedding} />}
        {activeTab === 'checklist' && <Checklist weddingId={wedding.id} />}
      </main>
    </div>
  );
}
