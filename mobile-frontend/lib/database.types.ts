/**
 * Database Types - JB Inventory Tracker
 * 
 * TypeScript types matching the Supabase schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'cashier' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'cashier' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'cashier' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      inventory_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          shift: 'AM' | 'PM'
          cashier_name: string
          table_number: string
          status: 'open' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date: string
          shift: 'AM' | 'PM'
          cashier_name: string
          table_number?: string
          status?: 'open' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_date?: string
          shift?: 'AM' | 'PM'
          cashier_name?: string
          table_number?: string
          status?: 'open' | 'closed'
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          session_id: string
          item_name: string
          unit: string | null
          beg_balance: number
          delivery: number
          pull_out: number
          ending: number // computed
          sold_out: number
          price: number
          total: number // computed
          remarks: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          item_name: string
          unit?: string | null
          beg_balance?: number
          delivery?: number
          pull_out?: number
          // ending is computed, cannot insert
          sold_out?: number
          price?: number
          // total is computed, cannot insert
          remarks?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          item_name?: string
          unit?: string | null
          beg_balance?: number
          delivery?: number
          pull_out?: number
          // ending is computed, cannot update
          sold_out?: number
          price?: number
          // total is computed, cannot update
          remarks?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      preset_items: {
        Row: {
          id: string
          user_id: string
          item_name: string
          unit: string | null
          default_price: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_name: string
          unit?: string | null
          default_price?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_name?: string
          unit?: string | null
          default_price?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Session = Database['public']['Tables']['inventory_sessions']['Row']
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
export type PresetItem = Database['public']['Tables']['preset_items']['Row']

export type SessionInsert = Database['public']['Tables']['inventory_sessions']['Insert']
export type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert']
export type PresetItemInsert = Database['public']['Tables']['preset_items']['Insert']

export type SessionUpdate = Database['public']['Tables']['inventory_sessions']['Update']
export type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update']
export type PresetItemUpdate = Database['public']['Tables']['preset_items']['Update']

// Extended types with relations
export type SessionWithItems = Session & {
  items: InventoryItem[]
}

export type SessionSummary = {
  id: string
  session_date: string
  shift: 'AM' | 'PM'
  status: 'open' | 'closed'
  item_count: number
  grand_total: number
}
