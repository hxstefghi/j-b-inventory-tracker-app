-- =============================================
-- Migration: Add POS Sales table
-- Tracks menu items sold per session for automatic
-- calculation of raw inventory "Sold Out" values
-- =============================================

-- Step 1: Create the pos_sales table
CREATE TABLE IF NOT EXISTS pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS pos_sales_session_id_idx ON pos_sales(session_id);
CREATE INDEX IF NOT EXISTS pos_sales_menu_item_id_idx ON pos_sales(menu_item_id);

-- Step 3: Create unique constraint to ensure one entry per menu item per session
CREATE UNIQUE INDEX IF NOT EXISTS pos_sales_session_menu_unique 
  ON pos_sales(session_id, menu_item_id);

-- Step 4: Enable Row Level Security
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Users can only see POS sales for sessions they own
CREATE POLICY "Users can view their own POS sales"
  ON pos_sales
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM inventory_sessions WHERE user_id = auth.uid()
    )
  );

-- Users can insert POS sales for sessions they own
CREATE POLICY "Users can insert POS sales for their sessions"
  ON pos_sales
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM inventory_sessions WHERE user_id = auth.uid()
    )
  );

-- Users can update POS sales for sessions they own
CREATE POLICY "Users can update their own POS sales"
  ON pos_sales
  FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM inventory_sessions WHERE user_id = auth.uid()
    )
  );

-- Users can delete POS sales for sessions they own
CREATE POLICY "Users can delete their own POS sales"
  ON pos_sales
  FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM inventory_sessions WHERE user_id = auth.uid()
    )
  );

-- Step 6: Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_pos_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pos_sales_updated_at_trigger
  BEFORE UPDATE ON pos_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_pos_sales_updated_at();

-- =============================================
-- VERIFICATION
-- Run this to confirm the changes:
-- =============================================
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'pos_sales'
-- ORDER BY ordinal_position;

-- Expected results:
-- id            | uuid      | gen_random_uuid() | NO
-- session_id    | uuid      |                   | NO
-- menu_item_id  | text      |                   | NO
-- quantity_sold | integer   | 0                 | YES
-- created_at    | timestamp | NOW()             | YES
-- updated_at    | timestamp | NOW()             | YES

-- =============================================
-- MENU_ITEM_ID Reference (from constants/menu.ts)
-- =============================================
-- 'chicken_1pc'        - 1 pc Chicken
-- 'chicken_2pc'        - 2 pcs Chicken
-- 'chicken_1pc_rice'   - 1 pc Chicken w/ Rice
-- 'chicken_2pc_rice'   - 2 pcs Chicken w/ Rice
-- 'skin_60g_rice'      - Skin 60g w/ Rice
-- 'skin_120g_rice'     - Skin 120g w/ Rice
-- 'skin_60g'           - Skin 60g
-- 'skin_120g'          - Skin 120g
-- 'extra_rice'         - Extra Rice
-- 'extra_gravy_1oz'    - Extra Gravy 1oz
-- 'extra_gravy_3oz'    - Extra Gravy 3oz
-- 'water'              - Bottled Water
-- 'coke_mismo'         - Coke Mismo
-- 'coke_1_5l'          - Coke 1.5L (combo only, no price)
-- 'chicken_1pc_coke'   - 1 pc Chicken w/ Coke 1.5L
-- 'chicken_2pc_coke'   - 2 pcs Chicken w/ Coke 1.5L
-- 'spicy_sauce'        - Spicy Sauce
