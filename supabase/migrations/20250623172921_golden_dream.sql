/*
  # Create chat messages table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `bill_id` (uuid, references bills.id)
      - `sender_id` (uuid, references users.id)
      - `type` (text, check constraint: text, image, payment_slip, system)
      - `content` (text, not null)
      - `image_url` (text, optional)
      - `is_payment_slip` (boolean, default false)
      - `payment_amount` (decimal, optional)
      - `payment_status` (text, check constraint: pending, verified, rejected)
      - `created_at` (timestamp with timezone, default now())
    
    - `message_reads`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `message_id` (uuid, references chat_messages.id)
      - `user_id` (uuid, references users.id)
      - `read_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for message access based on bill participation
    - Add policies for read status management

  3. Constraints
    - Unique constraint on message_reads (message_id, user_id)
    - Check constraints for payment status and message types
*/

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'payment_slip', 'system')),
  content text NOT NULL,
  image_url text,
  is_payment_slip boolean DEFAULT false,
  payment_amount decimal(10,2),
  payment_status text CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Create message_reads table
CREATE TABLE IF NOT EXISTS message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can read messages of bills they have access to"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE id = bill_id AND (
        created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM bill_participants 
          WHERE bill_id = bills.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create messages in bills they have access to"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM bills 
      WHERE id = bill_id AND (
        created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM bill_participants 
          WHERE bill_id = bills.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Bill creators can update payment status"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE id = bill_id AND created_by = auth.uid()
    )
  );

-- Message reads policies
CREATE POLICY "Users can read message read status of bills they have access to"
  ON message_reads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN bills b ON cm.bill_id = b.id
      WHERE cm.id = message_id AND (
        b.created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM bill_participants 
          WHERE bill_id = b.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage their own message reads"
  ON message_reads
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN bills b ON cm.bill_id = b.id
      WHERE cm.id = message_id AND (
        b.created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM bill_participants 
          WHERE bill_id = b.id AND user_id = auth.uid()
        )
      )
    )
  );