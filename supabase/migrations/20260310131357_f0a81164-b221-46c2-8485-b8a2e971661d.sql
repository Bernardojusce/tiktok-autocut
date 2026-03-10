
CREATE TABLE public.video_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.video_jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  clip_index integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  duration text,
  hook text,
  storage_path text,
  download_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clips" ON public.video_clips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clips" ON public.video_clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clips" ON public.video_clips FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket for processed clips
INSERT INTO storage.buckets (id, name, public) VALUES ('clips', 'clips', true);

CREATE POLICY "Users can read own clips" ON storage.objects FOR SELECT USING (bucket_id = 'clips');
CREATE POLICY "Service can upload clips" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'clips');
