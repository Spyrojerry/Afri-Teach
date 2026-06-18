export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type PublicTable = {
  Row: Record<string, any>
  Insert: Record<string, any>
  Update: Record<string, any>
  Relationships: []
}

type PublicView = {
  Row: Record<string, any>
  Relationships: []
}

type PublicFunction = {
  Args: Record<string, any>
  Returns: any
}

/**
 * The restored project did not include usable generated Supabase types.
 * This schema-aware compatibility definition keeps table/RPC names typed as
 * strings without collapsing every query to `never`. Replace it with output
 * from `supabase gen types typescript` when CLI access is available.
 */
export type Database = {
  public: {
    Tables: Record<string, PublicTable>
    Views: Record<string, PublicView>
    Functions: Record<string, PublicFunction>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  TableName extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[TableName]["Row"]

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][TableName]["Update"]

export const Constants = {
  public: {
    Enums: {},
  },
} as const
