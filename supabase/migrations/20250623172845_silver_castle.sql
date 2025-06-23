/*
  # Create friends and friend requests tables

  1. New Tables
    - `friend_requests`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `from_user_id` (uuid, references users.id)
      - `to_user_id` (uuid, references users.id)
      - `status` (text, check constraint: pending, accepted, declined)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())
    
    - `friends`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, references users.id)
      - `friend_id` (uuid, references users.id)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for friend requests (users can manage their own requests)
    - Add policies for friends (users can read their own friendships)

  3. Constraints
    - Unique constraint on friend_requests (from_user_id, to_user_id)
    - Unique constraint on friends (user_id, friend_id)
    - Check constraint to prevent self-friend requests
*/

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Friend requests policies
CREATE POLICY "Users can read their own friend requests"
  ON friend_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create friend requests"
  ON friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update friend requests they received"
  ON friend_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Friends policies
CREATE POLICY "Users can read their own friendships"
  ON friends
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships"
  ON friends
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for friend_requests updated_at
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create mutual friendship when request is accepted
CREATE OR REPLACE FUNCTION handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to accepted, create mutual friendship
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insert friendship for both users
    INSERT INTO friends (user_id, friend_id) VALUES (NEW.from_user_id, NEW.to_user_id);
    INSERT INTO friends (user_id, friend_id) VALUES (NEW.to_user_id, NEW.from_user_id);
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to handle friend request acceptance
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_acceptance();