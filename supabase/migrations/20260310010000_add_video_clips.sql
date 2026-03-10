-- Clips generated per processing job
CREATE TABLE public.video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.video_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clip_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  duration TEXT,
  storage_path TEXT,
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clips" ON public.video_clips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clips" ON public.video_clips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clips" ON public.video_clips
  FOR UPDATE USING (auth.uid() = user_id);

-- Optional helper indexes
CREATE INDEX video_clips_job_id_idx ON public.video_clips(job_id);
CREATE INDEX video_clips_user_id_idx ON public.video_clips(user_id);

-- Storage bucket for cut clips (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clips', 'clips', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies scoped to user folder prefix: <user_id>/...
CREATE POLICY "Users can read own clip objects" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'clips'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Users can insert own clip objects" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'clips'
  AND split_part(name, '/', 1) = auth.uid()::text
);
