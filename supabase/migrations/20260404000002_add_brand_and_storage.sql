-- Ajout colonne brand
ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS brand TEXT;

-- Bucket storage pour les photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-photos', 'clothing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy : chaque user voit ses propres photos
CREATE POLICY IF NOT EXISTS "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clothing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can view their own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'clothing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Public can view clothing photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'clothing-photos');
