/**
 * Database Module - JB Inventory Tracker
 *
 * Exports schema types and query functions for Supabase.
 * Uses Supabase client directly with typed TypeScript schemas.
 */

export * from './schema';
export * from './queries';
export { supabase } from '../supabase';
