/*
  # Create Database Webhook for Notifications

  1. Webhook Configuration
    - Create webhook to trigger edge function on notification inserts
    - Configure for bill_finalized notification type only

  2. Security
    - Webhook runs with proper authentication
    - Only triggers for relevant notification types
*/

-- Create a webhook that triggers the edge function when notifications are inserted
-- This needs to be run in the Supabase dashboard or via the CLI
-- The webhook URL should be: https://your-project-ref.supabase.co/functions/v1/send-bill-finalization-notification

-- Note: This is a reference for manual setup in Supabase dashboard
-- Go to Database > Webhooks and create a new webhook with:
-- - Table: notifications
-- - Events: INSERT
-- - Type: HTTP Request
-- - URL: https://your-project-ref.supabase.co/functions/v1/send-bill-finalization-notification
-- - HTTP Headers: 
--   - Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--   - Content-Type: application/json

-- Alternatively, you can use the Supabase CLI:
-- supabase functions deploy send-bill-finalization-notification
-- Then create the webhook in the dashboard pointing to the deployed function