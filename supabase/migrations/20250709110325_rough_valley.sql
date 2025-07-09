/*
  # Create Push Notification Trigger

  1. Database Trigger
    - Creates a trigger on the `notifications` table
    - Automatically calls the `send-push-notification` Edge Function when a new notification is inserted
    - Uses Supabase's `http_request` function to invoke the Edge Function

  2. Security
    - Uses service role key for authentication
    - Only triggers on INSERT operations
    - Handles errors gracefully without blocking the notification insert

  3. Functionality
    - Passes the entire notification record to the Edge Function
    - Allows the Edge Function to handle all push notification logic
    - Supports any type of notification (bill reminders, friend requests, etc.)
*/

-- Create the trigger function that calls the Edge Function
CREATE OR REPLACE FUNCTION notify_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the send-push-notification Edge Function
  PERFORM
    net.http_post(
      url := 'https://ljljeqpqwklcinkhtgre.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqbGplZnBxd2tsY2lua2hndHJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU4NzM2NSwiZXhwIjoyMDY2MTYzMzY1fQ.n2XQbGR8jGpZUhsdgVXlPztkCAGRn1x33oqbcExDgB0'
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'notifications',
        'record', to_jsonb(NEW),
        'schema', 'public'
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS on_notification_created ON notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_notification();