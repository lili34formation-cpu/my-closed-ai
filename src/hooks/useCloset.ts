import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClothingItem } from '@/types/closet';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export function useCloset() {
  const { user } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) { toast.error('Erreur chargement dressing'); console.error(error); }
    else setItems((data ?? []) as ClothingItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const addItem = async (item: Omit<ClothingItem, 'id' | 'user_id' | 'created_at' | 'worn_count'>) => {
    if (!user) return;
    const { error } = await supabase.from('clothing_items').insert({
      ...item,
      user_id: user.id,
      worn_count: 0,
    });
    if (error) { toast.error('Erreur ajout vêtement'); console.error(error); }
    else { toast.success('Vêtement ajouté !'); loadItems(); }
  };

  const updateItem = async (id: string, updates: Partial<ClothingItem>) => {
    const { error } = await supabase.from('clothing_items').update(updates).eq('id', id);
    if (error) { toast.error('Erreur modification'); console.error(error); }
    else loadItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('clothing_items').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression'); console.error(error); }
    else { toast.success('Vêtement supprimé'); loadItems(); }
  };

  const toggleFavorite = async (item: ClothingItem) => {
    await updateItem(item.id, { favorite: !item.favorite });
  };

  const incrementWorn = async (item: ClothingItem) => {
    await updateItem(item.id, { worn_count: item.worn_count + 1, last_worn: new Date().toISOString() });
  };

  return { items, loading, addItem, updateItem, deleteItem, toggleFavorite, incrementWorn, reload: loadItems };
}
