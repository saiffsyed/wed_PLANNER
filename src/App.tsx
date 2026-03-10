import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useWedding } from './hooks/useWedding';
import { Auth } from './components/Auth';
import { WeddingSetup } from './components/WeddingSetup';
import { Dashboard } from './components/Dashboard';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { wedding, loading: weddingLoading, refresh } = useWedding();
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    if (needsRefresh && user) {
      refresh();
      setNeedsRefresh(false);
    }
  }, [needsRefresh, user, refresh]);

  if (authLoading || weddingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!wedding) {
    return <WeddingSetup onComplete={() => setNeedsRefresh(true)} />;
  }

  return <Dashboard />;
}

export default App;
