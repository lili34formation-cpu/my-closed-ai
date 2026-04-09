CREATE TABLE IF NOT EXISTS outfit_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  item_ids text[] NOT NULL,
  worn_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own outfit history"
  ON outfit_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
