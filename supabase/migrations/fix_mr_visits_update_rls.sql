-- Fix: Allow MR to checkout (UPDATE status to SUBMITTED)
-- The previous policy had no explicit WITH CHECK, so it defaulted to USING which required status='OPEN'
-- The new row after update has status='SUBMITTED', which violated that check.

DROP POLICY IF EXISTS "mr_visits_update_open_only" ON public.mr_visits;

CREATE POLICY "mr_visits_update_open_only" ON public.mr_visits
  FOR UPDATE
  USING (
    mr_id = auth.uid() AND get_mr_role() = 'MR' AND status = 'OPEN'
  )
  WITH CHECK (
    -- New row must still belong to same MR; status can change to SUBMITTED
    mr_id = auth.uid()
  );
