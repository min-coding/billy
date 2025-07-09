/*
  # Due Date Reminder System Setup

  This migration sets up the infrastructure for due date reminders:
  
  1. Updates notification types to include due date reminders
  2. Ensures proper indexing for efficient reminder queries
  3. Sets up any additional constraints needed for the reminder system

  The actual Edge Function will be deployed separately and scheduled via cron.
*/

-- Add indexes to improve performance of due date reminder queries
CREATE INDEX IF NOT EXISTS idx_bills_due_date_status ON bills(due_date, status) WHERE status != 'closed' AND due_date IS NOT NULL;

-- Add index for notification lookups to prevent duplicate reminders
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_data ON notifications(user_id, type, ((data->>'bill_id')));

-- Add index for bill participants queries
CREATE INDEX IF NOT EXISTS idx_bill_participants_bill_user ON bill_participants(bill_id, user_id, has_submitted, payment_status);

-- Update the check constraint on notifications table to include new reminder types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Note: We're not adding a constraint here because the notification types are dynamic
-- The Edge Function will create notifications with types like:
-- - bill_due_reminder_upcoming_1_day
-- - bill_due_reminder_due_today  
-- - bill_due_reminder_overdue_1_day

-- Ensure the notifications table has proper structure for reminders
COMMENT ON COLUMN notifications.type IS 'Notification type - includes bill_due_reminder_* types for due date reminders';
COMMENT ON COLUMN notifications.data IS 'JSON data containing bill_id, reminder_stage, and other contextual information';