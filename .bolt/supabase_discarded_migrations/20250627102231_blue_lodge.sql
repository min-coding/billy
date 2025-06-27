/*
  # Add push token column to users table

  1. Changes
    - Add `push_token` column to `users` table to store Expo push notification tokens
    - Column is nullable since not all users may have notifications enabled
    - Column is of type TEXT to accommodate the Expo push token format

  2. Security
    - No additional RLS policies needed as push tokens are managed through existing user policies
    - Users can only update their own push tokens through the existing RLS policies
*/

-- Add push_token column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS push_token TEXT;