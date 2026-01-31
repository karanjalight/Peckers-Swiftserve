-- =============================================================================
-- MR Field Intelligence - Supabase Storage for Prescription Images
-- =============================================================================

-- Create storage bucket for prescription images (run via Supabase Dashboard or SQL Editor)
-- Bucket: mr-prescription-images
-- Public: false (private, signed URLs for viewing)
-- Allowed MIME: image/jpeg, image/png, image/webp

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mr-prescription-images',
  'mr-prescription-images',
  false,
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- Storage RLS: MR can upload to own folder; Managers/Admins can read
-- Path structure: {visit_id}/{filename}

CREATE POLICY "mr_prescription_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mr-prescription-images'
  AND auth.role() = 'authenticated'
  AND (
    -- MR can upload if visit is theirs and OPEN
    (
      public.get_mr_role() = 'MR'
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.mr_visits
        WHERE mr_id = auth.uid() AND status = 'OPEN'
      )
    )
    -- Admin can upload (for support)
    OR public.get_mr_role() = 'ADMIN'
  )
);

CREATE POLICY "mr_prescription_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mr-prescription-images'
  AND auth.role() = 'authenticated'
  AND public.is_mr_user()
);

CREATE POLICY "mr_prescription_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mr-prescription-images'
  AND auth.role() = 'authenticated'
  AND public.get_mr_role() = 'ADMIN'
);

-- No delete policy for regular users - preserve audit trail
CREATE POLICY "mr_prescription_delete_admin"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mr-prescription-images'
  AND public.get_mr_role() = 'ADMIN'
);
