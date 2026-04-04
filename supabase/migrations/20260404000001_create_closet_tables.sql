-- Table vêtements
CREATE TABLE public.clothing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  style TEXT NOT NULL,
  season TEXT NOT NULL DEFAULT 'Toutes saisons',
  image_url TEXT,
  favorite BOOLEAN NOT NULL DEFAULT false,
  worn_count INTEGER NOT NULL DEFAULT 0,
  last_worn TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own items" ON public.clothing_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.clothing_items;
