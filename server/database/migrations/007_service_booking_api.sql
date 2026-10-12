-- Phase 8: portable service booking read/write API hardening.
-- Keeps payment/coupon/subscription purchase authority outside this phase.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_status_check') THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending','assigned','confirmed','in_progress','completed','cancelled'));

CREATE INDEX IF NOT EXISTS idx_bookings_user_created
  ON bookings(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_created
  ON bookings(user_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_technician_status_date
  ON bookings(assigned_technician_id, status, assignment_date, created_at DESC)
  WHERE assigned_technician_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_assignment_date
  ON bookings(assignment_date, assigned_technician_id)
  WHERE assigned_technician_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_technicians_assignment_candidates
  ON technicians(approval_status, status, priority DESC, id)
  WHERE approval_status='approved' AND status='active';

-- One booking can consume at most one instance of each benefit type.
CREATE UNIQUE INDEX IF NOT EXISTS uq_benefit_usage_booking_type_portable
  ON subscription_benefits_usage(booking_id, benefit_type)
  WHERE booking_id IS NOT NULL;
