-- =============================================
-- Migration: Change BEG, DEL, PULL, END, SOLD_OUT to TEXT
-- Allow string values like "N/A", "broken", "3 packs", etc.
-- Only SOLD OUT will be used for computation (if numeric)
-- =============================================

-- Step 1: Drop the generated columns first (they depend on other columns)
ALTER TABLE inventory_items DROP COLUMN IF EXISTS ending;
ALTER TABLE inventory_items DROP COLUMN IF EXISTS total;

-- Step 2: Drop CHECK constraints on numeric columns
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_beg_balance_check;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_delivery_check;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_pull_out_check;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_sold_out_check;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_price_check;

-- Step 3: Change columns from NUMERIC to TEXT
ALTER TABLE inventory_items ALTER COLUMN beg_balance TYPE TEXT USING beg_balance::TEXT;
ALTER TABLE inventory_items ALTER COLUMN beg_balance SET DEFAULT NULL;

ALTER TABLE inventory_items ALTER COLUMN delivery TYPE TEXT USING delivery::TEXT;
ALTER TABLE inventory_items ALTER COLUMN delivery SET DEFAULT NULL;

ALTER TABLE inventory_items ALTER COLUMN pull_out TYPE TEXT USING pull_out::TEXT;
ALTER TABLE inventory_items ALTER COLUMN pull_out SET DEFAULT NULL;

ALTER TABLE inventory_items ALTER COLUMN sold_out TYPE TEXT USING sold_out::TEXT;
ALTER TABLE inventory_items ALTER COLUMN sold_out SET DEFAULT NULL;

-- Step 4: Add ending as a TEXT column (manual input, no longer auto-computed)
ALTER TABLE inventory_items ADD COLUMN ending TEXT DEFAULT NULL;

-- Step 5: Re-add price as NUMERIC with CHECK constraint
ALTER TABLE inventory_items ALTER COLUMN price TYPE NUMERIC USING price::NUMERIC;
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_price_check CHECK (price >= 0);

-- Step 6: Re-add total as a computed column (sold_out * price, only if sold_out is numeric)
ALTER TABLE inventory_items ADD COLUMN total NUMERIC GENERATED ALWAYS AS (
  CASE 
    WHEN sold_out ~ '^[0-9]+\.?[0-9]*$' THEN sold_out::NUMERIC * price
    ELSE 0
  END
) STORED;

-- =============================================
-- VERIFICATION
-- Run this to confirm the changes:
-- =============================================
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'inventory_items'
-- ORDER BY ordinal_position;

-- Expected results:
-- beg_balance  | text     | NULL | YES
-- delivery     | text     | NULL | YES
-- pull_out     | text     | NULL | YES
-- sold_out     | text     | NULL | YES
-- price        | numeric  | 0    | YES
-- ending       | text     | NULL | YES
-- total        | numeric  |      | YES (generated)
