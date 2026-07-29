-- Add video_url to public.exercises to store demo videos and setup storage bucket
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create Bucket 'exercise-videos' if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('exercise-videos', 'exercise-videos', true, 52428800) -- 50MB limit
ON CONFLICT (id) DO UPDATE SET file_size_limit = 52428800;

-- Storage Security Policies for 'exercise-videos'
DROP POLICY IF EXISTS "exercise-videos_upload_own" ON storage.objects;
CREATE POLICY "exercise-videos_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exercise-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "exercise-videos_read_all" ON storage.objects;
CREATE POLICY "exercise-videos_read_all" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'exercise-videos');

DROP POLICY IF EXISTS "exercise-videos_delete_own" ON storage.objects;
CREATE POLICY "exercise-videos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exercise-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
