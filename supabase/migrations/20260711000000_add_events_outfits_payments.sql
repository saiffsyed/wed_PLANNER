/*
  # Multi-Event Support, Vendor Payments, Outfits & Guest Enhancements

  ## Overview
  Extends the wedding planner for multi-function Indian/South Asian weddings
  (Nikah, Mehndi, Haldi, Sangeet, Baraat, Walima, etc.).

  ## New Tables

  ### 1. `events`
  Individual wedding functions/events
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key) - Links to weddings table
  - `name` (text) - Event name (e.g., Nikah, Mehndi, Walima)
  - `event_date` (date) - Date of the event
  - `event_time` (text) - Time of the event
  - `venue` (text) - Event venue
  - `dress_code` (text) - Dress code / theme
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)

  ### 2. `guest_events`
  Per-event guest invitations with per-event RSVP
  - `id` (uuid, primary key)
  - `guest_id` (uuid, foreign key) - Links to guests table
  - `event_id` (uuid, foreign key) - Links to events table
  - `rsvp_status` (text) - 'pending', 'accepted', 'declined'
  - `created_at` (timestamptz)
  - UNIQUE (guest_id, event_id)

  ### 3. `vendor_payments`
  Payment schedule (advance / installments / final) per vendor
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, foreign key) - Links to vendors table
  - `wedding_id` (uuid, foreign key) - Links to weddings table
  - `amount` (numeric) - Payment amount in rupees
  - `due_date` (date) - When the payment is due
  - `paid` (boolean) - Whether it has been paid
  - `paid_date` (date) - When it was actually paid
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 4. `outfits`
  Outfit / shopping tracker (lehnga, sherwani, jewelry, etc.)
  - `id` (uuid, primary key)
  - `wedding_id` (uuid, foreign key) - Links to weddings table
  - `event_id` (uuid, foreign key, nullable) - Which event it is for
  - `name` (text) - Item name
  - `for_person` (text) - Who it is for
  - `item_type` (text) - Outfit, Jewelry, Footwear, Accessories, Other
  - `shop` (text) - Shop / designer name
  - `estimated_cost` (numeric)
  - `actual_cost` (numeric)
  - `purchased` (boolean)
  - `notes` (text)
  - `created_at` (timestamptz)

  ## Altered Tables
  - `guests`: add `side` ('bride'/'groom'/'mutual'), `party_size` (integer, default 1)
    and `hall` ('men'/'women'/'mixed') — replaces the old `[hall:...]` notes prefix hack,
    with data migrated
  - `budget_items`: add optional `event_id`
  - `vendors`: add optional `event_id`

  ## Security
  RLS enabled on all new tables; ownership enforced through the weddings table.
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  event_date date,
  event_time text DEFAULT '',
  venue text DEFAULT '',
  dress_code text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create guest_events join table
CREATE TABLE IF NOT EXISTS guest_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  rsvp_status text DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (guest_id, event_id)
);

-- Create vendor_payments table
CREATE TABLE IF NOT EXISTS vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  amount numeric DEFAULT 0,
  due_date date,
  paid boolean DEFAULT false,
  paid_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create outfits table
CREATE TABLE IF NOT EXISTS outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  name text NOT NULL,
  for_person text DEFAULT '',
  item_type text DEFAULT 'Outfit',
  shop text DEFAULT '',
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  purchased boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Alter existing tables
ALTER TABLE guests ADD COLUMN IF NOT EXISTS side text DEFAULT 'mutual' CHECK (side IN ('bride', 'groom', 'mutual'));
ALTER TABLE guests ADD COLUMN IF NOT EXISTS party_size integer DEFAULT 1;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS hall text DEFAULT 'mixed' CHECK (hall IN ('men', 'women', 'mixed'));

-- Migrate legacy hall data stored as a notes prefix
UPDATE guests SET hall = 'men', notes = ltrim(replace(notes, '[hall:men]', ''))
  WHERE notes LIKE '[hall:men]%';
UPDATE guests SET hall = 'women', notes = ltrim(replace(notes, '[hall:women]', ''))
  WHERE notes LIKE '[hall:women]%';
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view events for their wedding"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = events.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events for their wedding"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = events.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update events for their wedding"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = events.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = events.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete events for their wedding"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = events.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Guest events policies (ownership via events -> weddings)
CREATE POLICY "Users can view guest events for their wedding"
  ON guest_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN weddings ON weddings.id = events.wedding_id
      WHERE events.id = guest_events.event_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create guest events for their wedding"
  ON guest_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      JOIN weddings ON weddings.id = events.wedding_id
      WHERE events.id = guest_events.event_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update guest events for their wedding"
  ON guest_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN weddings ON weddings.id = events.wedding_id
      WHERE events.id = guest_events.event_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      JOIN weddings ON weddings.id = events.wedding_id
      WHERE events.id = guest_events.event_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete guest events for their wedding"
  ON guest_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN weddings ON weddings.id = events.wedding_id
      WHERE events.id = guest_events.event_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Vendor payments policies
CREATE POLICY "Users can view vendor payments for their wedding"
  ON vendor_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_payments.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create vendor payments for their wedding"
  ON vendor_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_payments.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vendor payments for their wedding"
  ON vendor_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_payments.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_payments.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vendor payments for their wedding"
  ON vendor_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = vendor_payments.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Outfits policies
CREATE POLICY "Users can view outfits for their wedding"
  ON outfits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = outfits.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create outfits for their wedding"
  ON outfits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = outfits.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outfits for their wedding"
  ON outfits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = outfits.wedding_id
      AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = outfits.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete outfits for their wedding"
  ON outfits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = outfits.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_wedding_id ON events(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guest_events_guest_id ON guest_events(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_events_event_id ON guest_events(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_wedding_id ON vendor_payments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_outfits_wedding_id ON outfits(wedding_id);
