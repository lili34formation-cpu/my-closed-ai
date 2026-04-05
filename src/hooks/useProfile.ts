import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  morphotype: string | null;
  height: number | null;
  first_name: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data ?? null);
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, [user]);

  const saveProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() });
    if (error) { toast.error('Erreur sauvegarde profil'); console.error(error); }
    else { toast.success('Profil sauvegardé !'); loadProfile(); }
  };

  return { profile, loading, saveProfile };
}
