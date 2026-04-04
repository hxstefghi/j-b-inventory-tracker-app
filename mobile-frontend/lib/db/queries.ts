/**
 * Database Types & Queries - JB Inventory Tracker
 *
 * Typed database queries using Supabase client.
 */

import { supabase } from '../supabase';
import type { Profile, InventorySession, InventoryItem, PresetItem } from './schema';

// =============================================
// PROFILES
// =============================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates as any)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Profile;
}

// =============================================
// INVENTORY SESSIONS
// =============================================

export async function getSessionsByUser(userId: string, limit = 50): Promise<InventorySession[]> {
  const { data, error } = await supabase
    .from('inventory_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as InventorySession[];
}

export async function getSessionById(sessionId: string): Promise<InventorySession | null> {
  const { data, error } = await supabase
    .from('inventory_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  if (error) throw error;
  return data as InventorySession;
}

export async function getOpenSession(userId: string, date: Date, shift: 'AM' | 'PM'): Promise<InventorySession | null> {
  const dateStr = date.toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('inventory_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_date', dateStr)
    .eq('shift', shift)
    .eq('status', 'open')
    .maybeSingle();
  
  if (error) throw error;
  return data as InventorySession;
}

export async function createSession(session: any): Promise<InventorySession> {
  const { data, error } = await supabase
    .from('inventory_sessions')
    .insert(session)
    .select()
    .single();
  
  if (error) throw error;
  return data as InventorySession;
}

export async function updateSession(sessionId: string, updates: any): Promise<InventorySession> {
  const { data, error } = await supabase
    .from('inventory_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) throw error;
  return data as InventorySession;
}

export async function closeSession(sessionId: string): Promise<InventorySession> {
  return updateSession(sessionId, { status: 'closed' });
}

// =============================================
// INVENTORY ITEMS
// =============================================

export async function getItemsBySession(sessionId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data as InventoryItem[];
}

export async function createItem(item: any): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(item)
    .select()
    .single();
  
  if (error) throw error;
  return data as InventoryItem;
}

export async function updateItem(itemId: string, updates: any): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw error;
  return data as InventoryItem;
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', itemId);
  
  if (error) throw error;
}

export async function reorderItems(items: { id: string; sort_order: number }[]): Promise<void> {
  const updates = items.map(item => ({
    id: item.id,
    sort_order: item.sort_order,
  }));
  
  const { error } = await supabase
    .from('inventory_items')
    .upsert(updates, { onConflict: 'id' });
  
  if (error) throw error;
}

// =============================================
// PRESET ITEMS
// =============================================

export async function getPresetsByUser(userId: string): Promise<PresetItem[]> {
  const { data, error } = await supabase
    .from('preset_items')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data as PresetItem[];
}

export async function createPreset(preset: any): Promise<PresetItem> {
  const { data, error } = await supabase
    .from('preset_items')
    .insert(preset)
    .select()
    .single();
  
  if (error) throw error;
  return data as PresetItem;
}

export async function updatePreset(presetId: string, updates: any): Promise<PresetItem> {
  const { data, error } = await supabase
    .from('preset_items')
    .update(updates)
    .eq('id', presetId)
    .select()
    .single();
  
  if (error) throw error;
  return data as PresetItem;
}

export async function deletePreset(presetId: string): Promise<void> {
  const { error } = await supabase
    .from('preset_items')
    .delete()
    .eq('id', presetId);
  
  if (error) throw error;
}

// =============================================
// AGGREGATE QUERIES
// =============================================

export async function getSessionWithItems(sessionId: string) {
  const [session, items] = await Promise.all([
    getSessionById(sessionId),
    getItemsBySession(sessionId),
  ]);
  
  const grandTotal = items.reduce((sum, item) => {
    const total = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
    return sum + (total || 0);
  }, 0);
  
  return {
    session,
    items,
    grandTotal,
  };
}
