import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWedding } from '../hooks/useWedding';
import { Home, Users, IndianRupee, Building2, CheckSquare, LogOut } from 'lucide-react';
import { Overview } from './Overview';
import { Guests } from './Guests';
import { Budget } from './Budget';
import { Vendors } from './Vendors';
import { Checklist } from './Checklist';

type Tab = 'overview' | 'guests' | 'budget' | 'vendors' | 'checklist';

export function Dashboard() {
  const { signOut } = useAuth();
  const { wedding } = useWedding();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (!wedding) return null;

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: Home },
    { id: 'guests' as Tab, label: 'Guests', icon: Users },
    { id: 'budget' as Tab, label: 'Budget', icon: IndianRupee },
    { id: 'vendors' as Tab, label: 'Vendors', icon: Building2 },
    { id: 'checklist' as Tab, label: 'Checklist', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">
                {wedding.partner1_name} & {wedding.partner2_name}
              </h1>
              <div className="hidden md:flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 font-medium transition-colors flex items-center justify-center space-x-2 border-b-2 ${
                activeTab === tab.id
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <Overview wedding={wedding} />}
        {activeTab === 'guests' && <Guests weddingId={wedding.id} />}
        {activeTab === 'budget' && <Budget weddingId={wedding.id} />}
        {activeTab === 'vendors' && <Vendors weddingId={wedding.id} />}
        {activeTab === 'checklist' && <Checklist weddingId={wedding.id} />}
      </main>
    </div>
  );
}
