-- Add cancellation_reason column to assignments table
-- This field stores the reason when an assignment status is changed to 'cancelled'

ALTER TABLE assignments
ADD COLUMN cancellation_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN assignments.cancellation_reason IS 'Reason for cancellation (only filled when status is cancelled)';
