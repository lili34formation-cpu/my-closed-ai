import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OutfitHistoryEntry {
  id: string;
  name: string;
  item_ids: string[];
  worn_at: string;
  created_at: string;
}

export function useOutfitHistory() {
  const [history, setHistory] = useState<OutfitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("outfit_history")
      .select("*")
      .order("worn_at", { ascending: false })
      .limit(30);
    setHistory(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveOutfit = async (name: string, itemIds: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("outfit_history").insert({
      user_id: user.id,
      name,
      item_ids: itemIds,
      worn_at: new Date().toISOString().split("T")[0],
    });
    await load();
  };

  return { history, loading, saveOutfit };
}
