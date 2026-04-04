/**
 * Database Module - JB Inventory Tracker
 *
 * Schema types for Supabase tables (snake_case to match Supabase response).
 */

import { pgTable, text, timestamp, uuid, numeric, integer, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';

// Enums
export const shiftEnum = pgEnum('shift', ['AM', 'PM']);
export const statusEnum = pgEnum('status', ['open', 'closed']);
export const roleEnum = pgEnum('role', ['cashier', 'admin']);
export const categoryEnum = pgEnum('category', ['raw_inventory', 'menu_item']);

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name').notNull(),
  role: roleEnum('role').default('cashier'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Inventory Sessions table
export const inventorySessions = pgTable('inventory_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  sessionDate: timestamp('session_date').notNull(),
  shift: shiftEnum('shift').notNull(),
  cashierName: text('cashier_name').notNull(),
  tableNumber: text('table_number').default('Table 1'),
  status: statusEnum('status').default('open'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Inventory Items table
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull(),
  itemName: text('item_name').notNull(),
  unit: text('unit'),
  begBalance: text('beg_balance'), // Changed to TEXT to accept strings like "N/A", "broken"
  delivery: text('delivery'),      // Changed to TEXT
  pullOut: text('pull_out'),       // Changed to TEXT
  soldOut: text('sold_out'),       // Changed to TEXT (but used for computation if numeric)
  price: numeric('price').default('0'),
  ending: text('ending'),          // Changed to TEXT, no longer auto-computed
  total: numeric('total'),         // Computed: sold_out * price (if sold_out is numeric)
  remarks: text('remarks'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Preset Items table
export const presetItems = pgTable('preset_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  itemName: text('item_name').notNull(),
  category: categoryEnum('category').default('menu_item'),
  unit: text('unit'),
  defaultPrice: numeric('default_price').default('0'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports - Using snake_case to match Supabase response
export interface Profile {
  id: string;
  full_name: string;
  role: 'cashier' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface NewProfile {
  id: string;
  full_name: string;
  role?: 'cashier' | 'admin';
}

export interface InventorySession {
  id: string;
  user_id: string;
  session_date: string;
  shift: 'AM' | 'PM';
  cashier_name: string;
  table_number: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface NewInventorySession {
  user_id: string;
  session_date: string | Date;
  shift: 'AM' | 'PM';
  cashier_name: string;
  table_number?: string;
  status?: 'open' | 'closed';
}

export interface InventoryItem {
  id: string;
  session_id: string;
  item_name: string;
  unit: string | null;
  beg_balance: string | null; // Can be number or text like "N/A", "broken"
  delivery: string | null;     // Can be number or text
  pull_out: string | null;     // Can be number or text
  sold_out: string | null;     // Can be number or text (used for computation if numeric)
  price: string;               // Always numeric
  ending: string | null;       // Can be number or text, no longer auto-computed
  total: string | null;        // Computed from sold_out * price
  remarks: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewInventoryItem {
  session_id: string;
  item_name: string;
  unit?: string;
  beg_balance?: string | null; // Can be number or text
  delivery?: string | null;     // Can be number or text
  pull_out?: string | null;     // Can be number or text
  sold_out?: string | null;     // Can be number or text
  price?: string;
  ending?: string | null;       // Can be number or text
  remarks?: string;
  sort_order?: number;
}

export interface PresetItem {
  id: string;
  user_id: string;
  item_name: string;
  category: 'raw_inventory' | 'menu_item';
  unit: string | null;
  default_price: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewPresetItem {
  user_id: string;
  item_name: string;
  category?: 'raw_inventory' | 'menu_item';
  unit?: string;
  default_price?: string;
  sort_order?: number;
}
