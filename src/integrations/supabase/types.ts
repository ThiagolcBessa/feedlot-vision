export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inputs: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          notes: string | null
          price: number
          unit: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          notes?: string | null
          price?: number
          unit: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          notes?: string | null
          price?: number
          unit?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      premises: {
        Row: {
          admin_overhead_daily_per_head: number
          capacity_head: number
          created_at: string
          created_by: string
          default_mortality_pct: number
          default_reject_pct: number
          fixed_cost_daily_per_head: number
          id: string
          updated_at: string
        }
        Insert: {
          admin_overhead_daily_per_head?: number
          capacity_head?: number
          created_at?: string
          created_by: string
          default_mortality_pct?: number
          default_reject_pct?: number
          fixed_cost_daily_per_head?: number
          id?: string
          updated_at?: string
        }
        Update: {
          admin_overhead_daily_per_head?: number
          capacity_head?: number
          created_at?: string
          created_by?: string
          default_mortality_pct?: number
          default_reject_pct?: number
          fixed_cost_daily_per_head?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulation_results: {
        Row: {
          arroubas_gain: number
          arroubas_hook: number
          break_even_r_per_at: number
          carcass_weight_kg: number
          cost_per_animal: number
          cost_per_arrouba: number
          created_at: string
          exit_weight_kg: number
          id: string
          margin_total: number
          payback_days: number | null
          roi_pct: number
          simulation_id: string
          spread_r_per_at: number
        }
        Insert: {
          arroubas_gain: number
          arroubas_hook: number
          break_even_r_per_at: number
          carcass_weight_kg: number
          cost_per_animal: number
          cost_per_arrouba: number
          created_at?: string
          exit_weight_kg: number
          id?: string
          margin_total: number
          payback_days?: number | null
          roi_pct: number
          simulation_id: string
          spread_r_per_at: number
        }
        Update: {
          arroubas_gain?: number
          arroubas_hook?: number
          break_even_r_per_at?: number
          carcass_weight_kg?: number
          cost_per_animal?: number
          cost_per_arrouba?: number
          created_at?: string
          exit_weight_kg?: number
          id?: string
          margin_total?: number
          payback_days?: number | null
          roi_pct?: number
          simulation_id?: string
          spread_r_per_at?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_simulation_results_simulation_id"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          adg_kg_day: number
          created_at: string
          created_by: string
          days_on_feed: number
          depreciation_total: number
          dmi_kg_day: number | null
          dmi_pct_bw: number | null
          entry_weight_kg: number
          feed_cost_kg_dm: number
          feed_waste_pct: number
          financial_cost_total: number
          health_cost_total: number
          id: string
          mortality_pct: number
          notes: string | null
          overhead_total: number
          purchase_price_per_at: number | null
          purchase_price_per_kg: number | null
          selling_price_per_at: number
          title: string
          transport_cost_total: number
          updated_at: string
        }
        Insert: {
          adg_kg_day: number
          created_at?: string
          created_by: string
          days_on_feed: number
          depreciation_total?: number
          dmi_kg_day?: number | null
          dmi_pct_bw?: number | null
          entry_weight_kg: number
          feed_cost_kg_dm: number
          feed_waste_pct?: number
          financial_cost_total?: number
          health_cost_total?: number
          id?: string
          mortality_pct?: number
          notes?: string | null
          overhead_total?: number
          purchase_price_per_at?: number | null
          purchase_price_per_kg?: number | null
          selling_price_per_at: number
          title: string
          transport_cost_total?: number
          updated_at?: string
        }
        Update: {
          adg_kg_day?: number
          created_at?: string
          created_by?: string
          days_on_feed?: number
          depreciation_total?: number
          dmi_kg_day?: number | null
          dmi_pct_bw?: number | null
          entry_weight_kg?: number
          feed_cost_kg_dm?: number
          feed_waste_pct?: number
          financial_cost_total?: number
          health_cost_total?: number
          id?: string
          mortality_pct?: number
          notes?: string | null
          overhead_total?: number
          purchase_price_per_at?: number | null
          purchase_price_per_kg?: number | null
          selling_price_per_at?: number
          title?: string
          transport_cost_total?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          city: string | null
          code: string
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          code: string
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
