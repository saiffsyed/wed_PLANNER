/*
  # Wedding Planning App Schema

  ## Overview
  This migration creates a complete database schema for a wedding planning application
  that supports wedding details, guest management with RSVP tracking, budget management,
  vendor coordination, and timeline/checklist features. All monetary amounts are in rupees (₹).

  ## New Tables

  ### 1. `weddings`
  Stores core wedding information for each user
  - `id` (uuid, primary key) - Unique wedding identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `partner1_name` (text) - First partner's name
  - `partner2_name` (text) - Second partner's name
  - `wedding_date` (date) - Date of the wedding
  - `venue` (text) - Wedding venue name/location
  - `total_budget` (numeric) - Total budget in rupees
  - `guest_count_target` (integer) - Target number of guests
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `guests`
  Manages guest list and RSVP tracking
  - `id` (uuid, primary key) - Unique guest identifier
  - `wedding_id` (uuid, foreign key) - Links to weddings table
  - `name` (text) - Guest name
  - `email` (text) - Guest email address
  - `phone` (text) - Guest phone number
  - `rsvp_status` (text) - RSVP status: 'pending', 'accepted', 'declined'
  - `plus_one` (boolean) - Whether guest has a plus one
  - `dietary_restrictions` (text) - Any dietary requirements
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `budget_categories`
  Defines budget categories for organizing expenses
  - `id` (uuid, primary key) - Unique category identifier
  - `wedding_id` (uuid, foreign key) - Links to weddings table
  - `name` (text) - Category name (e.g., Venue, Catering, Photography)
  - `allocated_amount` (numeric) - Amount allocated in rupees
  - `color` (text) - Color code for UI display
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `budget_items`
  Tracks individual expenses within categories
  - `id` (uuid, primary key) - Unique item identifier
  - `category_id` (uuid, foreign key) - Links to budget_categories
  - `wedding_id` (uuid, foreign key) - Links to weddings table
  - `name` (text) - Item/expense name
  - `estimated_cost` (numeric) - Estimated cost in rupees
  - `actual_cost` (numeric) - Actual cost in rupees
  - `paid` (boolean) - Whether the item has been paid
  - `payment_date` (date) - Date of payment
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. `vendors`
  Manages vendor information and contacts
  - `id` (uuid, primary key) - Unique vendor identifier
  - `wedding_id` (uuid, foreign key) - Links to weddings table
  - `name` (text) - Vendor name
  - `category` (text) - Vendor category (e.g., Photographer, Caterer)
  - `contact_name` (text) - Primary contact person
  - `email` (text) - Vendor email
  - `phone` (text) - Vendor phone
  - `website` (text) - Vendor website
  - `cost` (numeric) - Cost in rupees
  - `paid` (boolean) - Whether vendor has been paid
  - `contract_signed` (boolean) - Whether contract is signed
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### 6. `checklist_items`
  Manages wedding planning timeline and tasks
  - `id` (uuid, primary key) - Unique checklist item identifier
  - `wedding_id` (uuid, foreign key) - Links to weddings table
  - `title` (text) - Task title
  - `description` (text) - Task description
  - `due_date` (date) - Task due date
  - `completed` (boolean) - Whether task is completed
  - `priority` (text) - Priority level: 'low', 'medium', 'high'
  - `category` (text) - Task category
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security

  ### Row Level Security (RLS)
  - RLS is enabled on all tables
  - Users can only access their own wedding data
  - Policies enforce authentication and ownership checks

  ### Policies Created
  For each table:
  - SELECT: Users can view their own wedding data
  - INSERT: Users can create records for their wedding
  - UPDATE: Users can update their own wedding data
  - DELETE: Users can delete their own wedding data

  ## Important Notes
  1. Currency: All monetary amounts are in rupees (₹)
  2. One-to-Many relationships: One wedding has many guests, budget items, vendors, and checklist items
  3. Default values: Sensible defaults are provided for boolean and timestamp fields
  4. Idempotency: All operations use IF NOT EXISTS to prevent errors on re-run
*/

-- Create weddings table
CREATE TABLE IF NOT EXISTS weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner1_name text NOT NULL DEFAULT '',
  partner2_name text NOT NULL DEFAULT '',
  wedding_date date,
  venue text DEFAULT '',
  total_budget numeric DEFAULT 0,
  guest_count_target integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  rsvp_status text DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined')),
  plus_one boolean DEFAULT false,
  dietary_restrictions text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create budget_categories table
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  allocated_amount numeric DEFAULT 0,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES budget_categories(id) ON DELETE CASCADE NOT NULL,
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  paid boolean DEFAULT false,
  payment_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  contact_name text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  website text DEFAULT '',
  cost numeric DEFAULT 0,
  paid boolean DEFAULT false,
  contract_signed boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  due_date date,
  completed boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Weddings policies
CREATE POLICY "Users can view own wedding"
  ON weddings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wedding"
  ON weddings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wedding"
  ON weddings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wedding"
  ON weddings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Guests policies
CREATE POLICY "Users can view guests for their wedding"
  ON guests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create guests for their wedding"
  ON guests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update guests for their wedding"
  ON guests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete guests for their wedding"
  ON guests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget categories policies
CREATE POLICY "Users can view budget categories for their wedding"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create budget categories for their wedding"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget categories for their wedding"
  ON budget_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget categories for their wedding"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Budget items policies
CREATE POLICY "Users can view budget items for their wedding"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create budget items for their wedding"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget items for their wedding"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget items for their wedding"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Vendors policies
CREATE POLICY "Users can view vendors for their wedding"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create vendors for their wedding"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vendors for their wedding"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vendors for their wedding"
  ON vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendors.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Checklist items policies
CREATE POLICY "Users can view checklist items for their wedding"
  ON checklist_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = checklist_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create checklist items for their wedding"
  ON checklist_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = checklist_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklist items for their wedding"
  ON checklist_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = checklist_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = checklist_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checklist items for their wedding"
  ON checklist_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = checklist_items.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_weddings_user_id ON weddings(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_wedding_id ON budget_categories(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_wedding_id ON budget_items(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category_id ON budget_items(category_id);
CREATE INDEX IF NOT EXISTS idx_vendors_wedding_id ON vendors(wedding_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_wedding_id ON checklist_items(wedding_id);
