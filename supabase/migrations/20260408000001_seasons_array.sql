-- Convert season (text) to seasons (text[])
ALTER TABLE clothing_items
  ADD COLUMN IF NOT EXISTS seasons text[] NOT NULL DEFAULT '{"Toutes saisons"}';

-- Migrate existing data: map 'Toutes saisons' → all 4 seasons, others → single-element array
UPDATE clothing_items SET seasons =
  CASE season
    WHEN 'Toutes saisons' THEN ARRAY['Printemps','Été','Automne','Hiver']
    ELSE ARRAY[season]
  END;

ALTER TABLE clothing_items DROP COLUMN season;
