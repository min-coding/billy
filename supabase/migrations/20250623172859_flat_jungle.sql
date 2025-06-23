/*
  # Create bills and related tables

  1. New Tables
    - `bills`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `title` (text, not null)
      - `description` (text, optional)
      - `total_amount` (decimal, not null)
      - `created_by` (uuid, references users.id)
      - `status` (text, check constraint: select, pay, closed)
      - `due_date` (timestamp with timezone, optional)
      - `tag` (text, optional)
      - `bank_name` (text, not null)
      - `account_name` (text, not null)
      - `account_number` (text, not null)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())
    
    - `bill_participants`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `bill_id` (uuid, references bills.id)
      - `user_id` (uuid, references users.id)
      - `created_at` (timestamp with timezone, default now())
    
    - `bill_items`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `bill_id` (uuid, references bills.id)
      - `name` (text, not null)
      - `price` (decimal, not null)
      - `quantity` (integer, not null, default 1)
      - `created_at` (timestamp with timezone, default now())
    
    - `bill_item_selections`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `bill_item_id` (uuid, references bill_items.id)
      - `user_id` (uuid, references users.id)
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for bill management (creators can manage, participants can read/select)
    - Add policies for participants and items based on bill access

  3. Constraints
    - Unique constraint on bill_participants (bill_id, user_id)
    - Unique constraint on bill_item_selections (bill_item_id, user_id)
    - Check constraints for positive amounts and quantities
*/

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  total_amount decimal(10,2) NOT NULL CHECK (total_amount > 0),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'select' CHECK (status IN ('select', 'pay', 'closed')),
  due_date timestamptz,
  tag text,
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bill_participants table
CREATE TABLE IF NOT EXISTS bill_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bill_id, user_id)
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

-- Create bill_item_selections table
CREATE TABLE IF NOT EXISTS bill_item_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_item_id uuid NOT NULL REFERENCES bill_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bill_item_id, user_id)
);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_item_selections ENABLE ROW LEVEL SECURITY;

-- Bills policies
CREATE POLICY "Users can read bills they created or participate in"
  ON bills
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM bill_participants 
      WHERE bill_id = bills.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bills"
  ON bills
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Bill creators can update their bills"
  ON bills
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Bill creators can delete their bills"
  ON bills
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Bill participants policies
CREATE POLICY "Users can read participants of bills they have access to"
  ON bill_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE id = bill_id AND (
        created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM bill_participants bp2 
          WHERE bp2.bill_id = bills.id AND bp2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Bill creators can manage participants"
  ON bill_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE id = bill_id AND created_by = auth.uid()
    )
  );

-- Bill items policies
CREATE POLICY "Users can read items of bills they have access to"
  ON bill_items
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

CREATE POLICY "Bill creators can manage items"
  ON bill_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills 
      WHERE id = bill_id AND created_by = auth.uid()
    )
  );

-- Bill item selections policies
CREATE POLICY "Users can read selections of bills they have access to"
  ON bill_item_selections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE bi.id = bill_item_id AND (
        b.created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM bill_participants 
          WHERE bill_id = b.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage their own selections"
  ON bill_item_selections
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE bi.id = bill_item_id AND (
        b.created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM bill_participants 
          WHERE bill_id = b.id AND user_id = auth.uid()
        )
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();