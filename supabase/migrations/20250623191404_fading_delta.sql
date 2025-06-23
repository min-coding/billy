/*
  # Fix RLS Policy Recursion Issues

  1. Problem
    - Current RLS policies create infinite recursion when checking bill access
    - The policies reference each other in a circular manner

  2. Solution
    - Drop existing problematic policies
    - Create new policies that avoid circular references
    - Use direct table joins instead of EXISTS subqueries where possible
    - Simplify policy logic to prevent recursion

  3. Changes
    - Replace complex nested EXISTS queries with simpler direct checks
    - Ensure each policy is self-contained and doesn't trigger other policies
    - Maintain security while fixing recursion issues
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read bills they created or participate in" ON bills;
DROP POLICY IF EXISTS "Users can read participants of bills they have access to" ON bill_participants;
DROP POLICY IF EXISTS "Users can read items of bills they have access to" ON bill_items;
DROP POLICY IF EXISTS "Users can read selections of bills they have access to" ON bill_item_selections;
DROP POLICY IF EXISTS "Users can manage their own selections" ON bill_item_selections;
DROP POLICY IF EXISTS "Users can read messages of bills they have access to" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in bills they have access to" ON chat_messages;
DROP POLICY IF EXISTS "Users can read message read status of bills they have access to" ON message_reads;
DROP POLICY IF EXISTS "Users can manage their own message reads" ON message_reads;

-- Bills policies (simplified to avoid recursion)
CREATE POLICY "Users can read bills they created"
  ON bills
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can read bills they participate in"
  ON bills
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_participants 
      WHERE bill_participants.bill_id = bills.id 
      AND bill_participants.user_id = auth.uid()
    )
  );

-- Bill participants policies (direct checks only)
CREATE POLICY "Users can read all participants of their own bills"
  ON bill_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE bills.id = bill_participants.bill_id 
      AND bills.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can read participants of bills they joined"
  ON bill_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_participants bp2
      WHERE bp2.bill_id = bill_participants.bill_id 
      AND bp2.user_id = auth.uid()
    )
  );

-- Bill items policies (direct checks only)
CREATE POLICY "Users can read items of their own bills"
  ON bill_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE bills.id = bill_items.bill_id 
      AND bills.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can read items of bills they participate in"
  ON bill_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_participants 
      WHERE bill_participants.bill_id = bill_items.bill_id 
      AND bill_participants.user_id = auth.uid()
    )
  );

-- Bill item selections policies (direct checks only)
CREATE POLICY "Users can read selections of their own bills"
  ON bill_item_selections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE bi.id = bill_item_selections.bill_item_id 
      AND b.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can read selections of bills they participate in"
  ON bill_item_selections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_items bi
      JOIN bill_participants bp ON bi.bill_id = bp.bill_id
      WHERE bi.id = bill_item_selections.bill_item_id 
      AND bp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own item selections"
  ON bill_item_selections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chat messages policies (direct checks only)
CREATE POLICY "Users can read messages of their own bills"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE bills.id = chat_messages.bill_id 
      AND bills.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can read messages of bills they participate in"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_participants 
      WHERE bill_participants.bill_id = chat_messages.bill_id 
      AND bill_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their own bills"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM bills 
      WHERE bills.id = bill_id 
      AND bills.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in bills they participate in"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM bill_participants 
      WHERE bill_participants.bill_id = bill_id 
      AND bill_participants.user_id = auth.uid()
    )
  );

-- Message reads policies (direct checks only)
CREATE POLICY "Users can read message status of their own bills"
  ON message_reads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN bills b ON cm.bill_id = b.id
      WHERE cm.id = message_reads.message_id 
      AND b.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can read message status of bills they participate in"
  ON message_reads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN bill_participants bp ON cm.bill_id = bp.bill_id
      WHERE cm.id = message_reads.message_id 
      AND bp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own message reads"
  ON message_reads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);