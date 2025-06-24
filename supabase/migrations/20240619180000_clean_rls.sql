-- Migration: Clean RLS policies for bill sharing app
-- Date: 2024-06-19

-- 1. Drop all old policies
DROP POLICY IF EXISTS "Users can read bills they created" ON bills;
DROP POLICY IF EXISTS "Users can read bills they participate in" ON bills;
DROP POLICY IF EXISTS "Users can create bills" ON bills;
DROP POLICY IF EXISTS "Users can update bills they own" ON bills;
DROP POLICY IF EXISTS "Users can delete bills they own" ON bills;

DROP POLICY IF EXISTS "Users can read their own participation records" ON bill_participants;
DROP POLICY IF EXISTS "Bill owners can read participants in their bills" ON bill_participants;
DROP POLICY IF EXISTS "Bill owners can manage participants" ON bill_participants;

DROP POLICY IF EXISTS "Users can read items of bills they have access to" ON bill_items;
DROP POLICY IF EXISTS "Bill owners can manage items" ON bill_items;

DROP POLICY IF EXISTS "Users can read selections of bills they have access to" ON bill_item_selections;
DROP POLICY IF EXISTS "Users can manage their own selections" ON bill_item_selections;

DROP POLICY IF EXISTS "Users can read messages of bills they have access to" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in bills they have access to" ON chat_messages;

-- 2. Create SECURITY DEFINER function for bill ownership
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.user_owns_bill(bill_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM bills WHERE id = bill_id AND created_by = user_id
  );
$$;

GRANT EXECUTE ON FUNCTION private.user_owns_bill(uuid, uuid) TO authenticated;

-- 3. RLS policies for bills
CREATE POLICY "Users can read bills they created"
  ON bills
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can read bills they participate in"
  ON bills
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT bill_id FROM bill_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bills"
  ON bills
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update bills they own"
  ON bills
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete bills they own"
  ON bills
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- 4. RLS policies for bill_participants
CREATE POLICY "Users can read their own participation records"
  ON bill_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Bill owners can read participants in their bills"
  ON bill_participants
  FOR SELECT
  TO authenticated
  USING (private.user_owns_bill(bill_id, auth.uid()));

CREATE POLICY "Bill owners can manage participants"
  ON bill_participants
  FOR ALL
  TO authenticated
  USING (private.user_owns_bill(bill_id, auth.uid()));

-- 5. RLS policies for bill_items
CREATE POLICY "Users can read items of bills they have access to"
  ON bill_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE id = bill_items.bill_id
        AND (
          created_by = auth.uid()
          OR id IN (SELECT bill_id FROM bill_participants WHERE user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Bill owners can manage items"
  ON bill_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE id = bill_items.bill_id
        AND created_by = auth.uid()
    )
  );

-- 6. RLS policies for bill_item_selections
CREATE POLICY "Users can read selections of bills they have access to"
  ON bill_item_selections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_items
      JOIN bills ON bill_items.bill_id = bills.id
      WHERE bill_items.id = bill_item_selections.bill_item_id
        AND (
          bills.created_by = auth.uid()
          OR bills.id IN (SELECT bill_id FROM bill_participants WHERE user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Users can manage their own selections"
  ON bill_item_selections
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- 7. (Optional) RLS policies for chat_messages
CREATE POLICY "Users can read messages of bills they have access to"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE id = chat_messages.bill_id
        AND (
          created_by = auth.uid()
          OR id IN (SELECT bill_id FROM bill_participants WHERE user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Users can create messages in bills they have access to"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bills
      WHERE id = chat_messages.bill_id
        AND (
          created_by = auth.uid()
          OR id IN (SELECT bill_id FROM bill_participants WHERE user_id = auth.uid())
        )
    )
  ); 