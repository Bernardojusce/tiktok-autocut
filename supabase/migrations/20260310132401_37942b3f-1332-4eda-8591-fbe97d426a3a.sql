
-- Allow authenticated users to upload files to the clips bucket
CREATE POLICY "Authenticated users can upload to clips" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clips');

-- Allow authenticated users to read their uploaded files
CREATE POLICY "Authenticated users can read clips" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'clips');
