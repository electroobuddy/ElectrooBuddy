BEGIN;

ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS disabled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_technicians_approval_created
  ON technicians (approval_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_technicians_workload
  ON technicians (approval_status, status, priority DESC, daily_limit, id);
CREATE INDEX IF NOT EXISTS idx_bookings_assignment_workload
  ON bookings (assigned_technician_id, assignment_date, status)
  WHERE deleted_at IS NULL AND assigned_technician_id IS NOT NULL;

COMMIT;
