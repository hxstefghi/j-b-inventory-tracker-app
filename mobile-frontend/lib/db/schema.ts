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
  begBalance: numeric('beg_balance').default('0'),
  delivery: numeric('delivery').default('0'),
  pullOut: numeric('pull_out').default('0'),
  soldOut: numeric('sold_out').default('0'),
  price: numeric('price').default('0'),
  ending: numeric('ending'),
  total: numeric('total'),
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
  beg_balance: string;
  delivery: string;
  pull_out: string;
  sold_out: string;
  price: string;
  ending: string | null;
  total: string | null;
  remarks: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewInventoryItem {
  session_id: string;
  item_name: string;
  unit?: string;
  beg_balance?: string;
  delivery?: string;
  pull_out?: string;
  sold_out?: string;
  price?: string;
  ending?: string;
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
