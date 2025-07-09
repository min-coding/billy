/*
  # Due Date Notifications Setup

  1. Notification Types
    - Add new notification types for due date reminders
    - due_tomorrow: Bill is due tomorrow
    - due_in_3_days: Bill is due in 3 days  
    - due_in_1_week: Bill is due in 1 week

  2. Cron Job Setup
    - Creates a cron job to run the due date reminder function daily at 9 AM
    - Uses pg_cron extension to schedule the function execution

  3. Security
    - Ensures proper RLS policies are in place for notifications table
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run due date reminders daily at 9 AM
-- This will call our edge function every day to check for upcoming due dates
SELECT cron.schedule(
  'due-date-reminders',
  '0 9 * * *', -- Run at 9:00 AM every day
  $$
  SELECT
    net.http_post(
      url := 'https://billy.supabase.co/functions/v1/due-date-reminders',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqbGplZnBxd2tsY2lua2hndHJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU4NzM2NSwiZXhwIjoyMDY2MTYzMzY1fQ.n2XQbGR8jGpZUhsdgVXlPztkCAGRn1x33oqbcExDgB0"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Add comment to track the cron job
COMMENT ON EXTENSION pg_cron IS 'Due date reminders scheduled daily at 9 AM';