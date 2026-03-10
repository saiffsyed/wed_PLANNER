import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Wedding = Database['public']['Tables']['weddings']['Row'];

export function useWedding() {
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWedding(null);
      setLoading(false);
      return;
    }

    loadWedding();
  }, [user]);

  const loadWedding = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weddings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setWedding(data);
    } catch (err) {
      console.error('Error loading wedding:', err);
    } finally {
      setLoading(false);
    }
  };

  return { wedding, loading, refresh: loadWedding };
}
