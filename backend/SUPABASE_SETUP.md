# Supabase Backend Setup Guide
## JB Inventory Tracker App

This guide will walk you through setting up the complete Supabase backend for the inventory tracker app.

---

## Table of Contents
1. [Create Supabase Project](#1-create-supabase-project)
2. [Database Schema Setup](#2-database-schema-setup)
3. [Row Level Security (RLS)](#3-row-level-security-rls)
4. [Configure Authentication](#4-configure-authentication)
5. [Environment Variables](#5-environment-variables)
6. [Client Setup](#6-client-setup)
7. [Testing the Connection](#7-testing-the-connection)

---

## 1. Create Supabase Project

### Step 1.1: Sign Up / Log In
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email

### Step 1.2: Create New Project
1. Click "New Project"
2. Fill in the details:
   - **Name**: `jb-inventory-tracker` (or your preferred name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose the closest to the Philippines (e.g., Singapore `ap-southeast-1`)
   - **Pricing Plan**: Free tier is sufficient for development
3. Click "Create new project"
4. Wait 2-3 minutes for the project to provision

### Step 1.3: Get Your API Keys
Once the project is ready:
1. Go to **Settings** → **API**
2. You'll need these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUz...` (long string)
   - **service_role key**: `eyJhbGciOiJIUz...` (DO NOT expose this in client code!)

**Save these values** — you'll need them in step 5.

---

## 2. Database Schema Setup

### Step 2.1: Open SQL Editor
1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the SQL schema below
4. Click "Run" (or press `Ctrl + Enter`)

### Step 2.2: Execute the Schema

```sql
-- =============================================
-- JB Inventory Tracker - Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'cashier' CHECK (role IN ('cashier', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. INVENTORY SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('AM', 'PM')),
  cashier_name TEXT NOT NULL,
  table_number TEXT DEFAULT 'Table 1',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate open sessions for same date + shift
  UNIQUE(user_id, session_date, shift, status)
);

-- =============================================
-- 3. INVENTORY ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  unit TEXT, -- 'pcs', 'kg', 'packs', 'bottles', etc.
  
  -- Manual inputs
  beg_balance NUMERIC DEFAULT 0 CHECK (beg_balance >= 0),
  delivery NUMERIC DEFAULT 0 CHECK (delivery >= 0),
  pull_out NUMERIC DEFAULT 0 CHECK (pull_out >= 0),
  sold_out NUMERIC DEFAULT 0 CHECK (sold_out >= 0),
  price NUMERIC DEFAULT 0 CHECK (price >= 0),
  
  -- Auto-computed columns
  ending NUMERIC GENERATED ALWAYS AS (beg_balance + delivery - pull_out) STORED,
  total NUMERIC GENERATED ALWAYS AS (sold_out * price) STORED,
  
  remarks TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. PRESET ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS preset_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'menu_item' CHECK (category IN ('raw_inventory', 'menu_item')),
  unit TEXT,
  default_price NUMERIC DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One item name per user
  UNIQUE(user_id, item_name)
);

-- =============================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_date 
  ON inventory_sessions(user_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_status 
  ON inventory_sessions(status);

CREATE INDEX IF NOT EXISTS idx_items_session 
  ON inventory_items(session_id);

CREATE INDEX IF NOT EXISTS idx_preset_items_user 
  ON preset_items(user_id, sort_order);

-- =============================================
-- 6. UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON inventory_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preset_items_updated_at
  BEFORE UPDATE ON preset_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. AUTO-CREATE PROFILE ON SIGN UP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'cashier'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 8. SEED DEFAULT PRESET ITEMS (Optional)
-- =============================================
-- These will be inserted for each user when they first sign up.
-- You can manually insert them or create them via the app.

COMMENT ON TABLE profiles IS 'User profile information';
COMMENT ON TABLE inventory_sessions IS 'Daily inventory tracking sessions (AM/PM)';
COMMENT ON TABLE inventory_items IS 'Individual items tracked per session';
COMMENT ON TABLE preset_items IS 'Reusable item templates per user';
```

✅ **Verification**: Go to **Table Editor** in Supabase and confirm you see:
- `profiles`
- `inventory_sessions`
- `inventory_items`
- `preset_items`

---

## 3. Row Level Security (RLS)

Row Level Security ensures users can only access their own data.

### Step 3.1: Enable RLS
Go to **Authentication** → **Policies** or use SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_items ENABLE ROW LEVEL SECURITY;
```

### Step 3.2: Create Policies

```sql
-- =============================================
-- PROFILES POLICIES
-- =============================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- INVENTORY SESSIONS POLICIES
-- =============================================
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON inventory_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create own sessions"
  ON inventory_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON inventory_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON inventory_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- INVENTORY ITEMS POLICIES
-- =============================================
-- Users can view items in their sessions
CREATE POLICY "Users can view own items"
  ON inventory_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inventory_sessions
      WHERE inventory_sessions.id = inventory_items.session_id
        AND inventory_sessions.user_id = auth.uid()
    )
  );

-- Users can insert items in their sessions
CREATE POLICY "Users can create own items"
  ON inventory_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventory_sessions
      WHERE inventory_sessions.id = inventory_items.session_id
        AND inventory_sessions.user_id = auth.uid()
    )
  );

-- Users can update items in their sessions
CREATE POLICY "Users can update own items"
  ON inventory_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM inventory_sessions
      WHERE inventory_sessions.id = inventory_items.session_id
        AND inventory_sessions.user_id = auth.uid()
    )
  );

-- Users can delete items in their sessions
CREATE POLICY "Users can delete own items"
  ON inventory_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM inventory_sessions
      WHERE inventory_sessions.id = inventory_items.session_id
        AND inventory_sessions.user_id = auth.uid()
    )
  );

-- =============================================
-- PRESET ITEMS POLICIES
-- =============================================
-- Users can view their own presets
CREATE POLICY "Users can view own presets"
  ON preset_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own presets
CREATE POLICY "Users can create own presets"
  ON preset_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own presets
CREATE POLICY "Users can update own presets"
  ON preset_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own presets
CREATE POLICY "Users can delete own presets"
  ON preset_items FOR DELETE
  USING (auth.uid() = user_id);
```

✅ **Verification**: Go to **Authentication** → **Policies** and confirm policies are listed.

---

## 4. Configure Authentication

### Step 4.1: Email Auth Settings
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize "Confirm signup" email if desired

### Step 4.2: Disable Email Confirmation (for development only)
If you want to skip email verification during development:
1. Go to **Authentication** → **Settings**
2. Scroll to "Email Auth"
3. **Disable** "Enable email confirmations"

⚠️ **Re-enable this in production!**

---

## 5. Environment Variables

### Step 5.1: Create `.env` file
In your `mobile-frontend` directory, create a `.env` file:

```bash
# mobile-frontend/.env

EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from **Settings → API**.

### Step 5.2: Add `.env` to `.gitignore`
Ensure `.env` is in your `.gitignore`:

```
.env
.env.local
```

---

## 6. Client Setup

### Step 6.1: Install Supabase Dependencies
Already installed! ✅ (You ran this earlier)
```bash
npm install @supabase/supabase-js
```

### Step 6.2: Create Supabase Client
Create `lib/supabase.ts`:

**(I'll create this file for you in the next step)**

---

## 7. Testing the Connection

### Step 7.1: Test in SQL Editor
Run this query to verify everything works:

```sql
SELECT * FROM profiles;
SELECT * FROM inventory_sessions;
SELECT * FROM inventory_items;
SELECT * FROM preset_items;
```

All should return empty results (no errors).

### Step 7.2: Test Sign Up Flow
Once we integrate auth in the app, you'll:
1. Sign up with email + password
2. Check **Authentication** → **Users** to see the new user
3. Check **Table Editor** → `profiles` to see the auto-created profile

---

## Next Steps

1. ✅ Run the SQL schema (Step 2.2)
2. ✅ Enable RLS and create policies (Step 3)
3. ✅ Configure email auth (Step 4)
4. ✅ Add environment variables (Step 5)
5. ⏳ I'll create the Supabase client setup next
6. ⏳ Then we'll build the authentication screens

---

## Useful Commands

### Reset All Data (CAUTION!)
```sql
TRUNCATE TABLE inventory_items CASCADE;
TRUNCATE TABLE inventory_sessions CASCADE;
TRUNCATE TABLE preset_items CASCADE;
```

### Check Current Session
```sql
SELECT auth.uid(); -- Returns current user's ID
```

### View All Policies
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

That's it for the Supabase backend setup! Follow the steps above, then let me know when you're ready to integrate it with the React Native app.

---

## Migration: Add Category Column to Preset Items

If you already created the `preset_items` table and need to add the `category` column, run this migration:

```sql
-- Add category column to preset_items table
ALTER TABLE preset_items 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'menu_item' 
CHECK (category IN ('raw_inventory', 'menu_item'));

-- Update existing items to have the default category
UPDATE preset_items SET category = 'menu_item' WHERE category IS NULL;
```

This adds support for categorizing items as either "Raw Inventory" (e.g., Chicken, Rice, Gravy) or "Menu Items" (e.g., 1pc Ala Carte, JB Fantastic).
