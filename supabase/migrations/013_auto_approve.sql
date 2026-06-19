-- ============================================================
-- 013 · Auto-approve: remove manual approval flow
-- All records are approved automatically when clock_out is set
-- ============================================================

-- 1. Remove lock that prevented updating approved records
DROP TRIGGER IF EXISTS lock_approved ON time_records;
DROP FUNCTION IF EXISTS lock_approved();

-- 2. Update calc_duration trigger to also auto-approve on clock_out
CREATE OR REPLACE FUNCTION calc_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL AND OLD.clock_out IS NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Approve all existing pending records that already have clock_out set
UPDATE time_records
SET status = 'approved'
WHERE status = 'pending'
  AND clock_out IS NOT NULL;

-- 4. Also default new records to 'approved' (open records start as approved too)
ALTER TABLE time_records
  ALTER COLUMN status SET DEFAULT 'approved';
