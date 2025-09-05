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
      negotiations: {
        Row: {
          agio_magro_r: number | null
          aprovado_por: string | null
          concat_label: string | null
          contrato: string | null
          created_at: string | null
          created_by: string | null
          custo_ms_kg: number | null
          daily_r_por_cab: number | null
          date_ref: string
          dias_cocho: number | null
          dieta: string | null
          dmi_kg_dia: number | null
          frete_confinamento_r: number | null
          frete_pecuarista_r: number | null
          gmd_kg_dia: number | null
          icms_devolucao_r: number | null
          id: string
          modalidade: string
          originator_id: string | null
          pecuarista_name: string
          peso_entrada_balancao_kg: number | null
          peso_entrada_balancinha_kg: number | null
          peso_fazenda_kg: number | null
          preco_boi_gordo_r_por_arroba: number | null
          preco_boi_magro_r_por_arroba: number | null
          price_r_por_arroba: number | null
          qtd_animais: number | null
          quebra_balanca_pct: number | null
          quebra_fazenda_pct: number | null
          rc_pct: number | null
          rendimento_boi_magro_prod_pct: number | null
          scale_type: string | null
          status: string | null
          taxa_abate_r: number | null
          termo: string | null
          tipo_animal: string | null
          unit_code: string | null
          unit_id: string | null
        }
        Insert: {
          agio_magro_r?: number | null
          aprovado_por?: string | null
          concat_label?: string | null
          contrato?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_ms_kg?: number | null
          daily_r_por_cab?: number | null
          date_ref: string
          dias_cocho?: number | null
          dieta?: string | null
          dmi_kg_dia?: number | null
          frete_confinamento_r?: number | null
          frete_pecuarista_r?: number | null
          gmd_kg_dia?: number | null
          icms_devolucao_r?: number | null
          id?: string
          modalidade: string
          originator_id?: string | null
          pecuarista_name: string
          peso_entrada_balancao_kg?: number | null
          peso_entrada_balancinha_kg?: number | null
          peso_fazenda_kg?: number | null
          preco_boi_gordo_r_por_arroba?: number | null
          preco_boi_magro_r_por_arroba?: number | null
          price_r_por_arroba?: number | null
          qtd_animais?: number | null
          quebra_balanca_pct?: number | null
          quebra_fazenda_pct?: number | null
          rc_pct?: number | null
          rendimento_boi_magro_prod_pct?: number | null
          scale_type?: string | null
          status?: string | null
          taxa_abate_r?: number | null
          termo?: string | null
          tipo_animal?: string | null
          unit_code?: string | null
          unit_id?: string | null
        }
        Update: {
          agio_magro_r?: number | null
          aprovado_por?: string | null
          concat_label?: string | null
          contrato?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_ms_kg?: number | null
          daily_r_por_cab?: number | null
          date_ref?: string
          dias_cocho?: number | null
          dieta?: string | null
          dmi_kg_dia?: number | null
          frete_confinamento_r?: number | null
          frete_pecuarista_r?: number | null
          gmd_kg_dia?: number | null
          icms_devolucao_r?: number | null
          id?: string
          modalidade?: string
          originator_id?: string | null
          pecuarista_name?: string
          peso_entrada_balancao_kg?: number | null
          peso_entrada_balancinha_kg?: number | null
          peso_fazenda_kg?: number | null
          preco_boi_gordo_r_por_arroba?: number | null
          preco_boi_magro_r_por_arroba?: number | null
          price_r_por_arroba?: number | null
          qtd_animais?: number | null
          quebra_balanca_pct?: number | null
          quebra_fazenda_pct?: number | null
          rc_pct?: number | null
          rendimento_boi_magro_prod_pct?: number | null
          scale_type?: string | null
          status?: string | null
          taxa_abate_r?: number | null
          termo?: string | null
          tipo_animal?: string | null
          unit_code?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_originator_id_fkey"
            columns: ["originator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      premises: {
        Row: {
          admin_overhead_daily_per_head: number
          capacity_head: number
          carcass_yield_pct: number
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
          carcass_yield_pct?: number
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
          carcass_yield_pct?: number
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
      scenario_results: {
        Row: {
          arroubas_gain: number | null
          arroubas_hook: number | null
          break_even_r_per_at: number | null
          carcass_weight_kg: number | null
          cost_per_animal: number | null
          cost_per_arrouba: number | null
          created_at: string | null
          created_by: string | null
          exit_weight_kg: number | null
          id: string
          margin_total: number | null
          payback_days: number | null
          roi_pct: number | null
          scenario_id: string | null
          spread_r_per_at: number | null
        }
        Insert: {
          arroubas_gain?: number | null
          arroubas_hook?: number | null
          break_even_r_per_at?: number | null
          carcass_weight_kg?: number | null
          cost_per_animal?: number | null
          cost_per_arrouba?: number | null
          created_at?: string | null
          created_by?: string | null
          exit_weight_kg?: number | null
          id?: string
          margin_total?: number | null
          payback_days?: number | null
          roi_pct?: number | null
          scenario_id?: string | null
          spread_r_per_at?: number | null
        }
        Update: {
          arroubas_gain?: number | null
          arroubas_hook?: number | null
          break_even_r_per_at?: number | null
          carcass_weight_kg?: number | null
          cost_per_animal?: number | null
          cost_per_arrouba?: number | null
          created_at?: string | null
          created_by?: string | null
          exit_weight_kg?: number | null
          id?: string
          margin_total?: number | null
          payback_days?: number | null
          roi_pct?: number | null
          scenario_id?: string | null
          spread_r_per_at?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_results_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "simulation_scenarios"
            referencedColumns: ["id"]
          },
        ]
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
      simulation_scenarios: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          label: string
          params: Json
          simulation_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          label: string
          params: Json
          simulation_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          label?: string
          params?: Json
          simulation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_scenarios_simulation_id_fkey"
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
          negotiation_id: string | null
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
          negotiation_id?: string | null
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
          negotiation_id?: string | null
          notes?: string | null
          overhead_total?: number
          purchase_price_per_at?: number | null
          purchase_price_per_kg?: number | null
          selling_price_per_at?: number
          title?: string
          transport_cost_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
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
      unit_price_matrix: {
        Row: {
          bk: number | null
          break_even_r_por_cab: number | null
          carc_por_arroba: number | null
          cf_r: number | null
          concat_label: string
          consumo_ms_kg_dia: number | null
          corp_r: number | null
          created_at: string | null
          created_by: string | null
          ctr_r: number | null
          custo_ajuste_racao_kg: number | null
          custo_alimentar: number | null
          custo_fixo_outros_r: number | null
          custo_fixo_racao_kg: number | null
          custo_ms_dia_racao_kg: number | null
          custo_ms_total: number | null
          depr_r: number | null
          desp_var_r: number | null
          diaria_r_por_cab_dia: number | null
          dias_cocho: number | null
          dieta: string
          end_validity: string | null
          faixa_label: string | null
          fin_r: number | null
          frete_r: number | null
          ganho_arroba_por_kg: number | null
          gmd_kg_dia: number | null
          id: string
          is_active: boolean | null
          modalidade: string
          mortes_pct: number | null
          pct_pv: number | null
          pct_rc: number | null
          peso_ate_kg: number | null
          peso_carc_kg: number | null
          peso_de_kg: number | null
          peso_gancho_arroba: number | null
          peso_medio_kg: number | null
          peso_saida_carc_kg: number | null
          peso_saida_kg: number | null
          prod_arroba: number | null
          rejeito_pct: number | null
          sanitario_pct: number | null
          spread_margem: number | null
          start_validity: string | null
          tabela_base_r_por_arroba: number | null
          tabela_final_r_por_arroba: number | null
          tipo_animal: string
          unit_code: string
          updated_at_table: string | null
          vigencia_label: string | null
        }
        Insert: {
          bk?: number | null
          break_even_r_por_cab?: number | null
          carc_por_arroba?: number | null
          cf_r?: number | null
          concat_label: string
          consumo_ms_kg_dia?: number | null
          corp_r?: number | null
          created_at?: string | null
          created_by?: string | null
          ctr_r?: number | null
          custo_ajuste_racao_kg?: number | null
          custo_alimentar?: number | null
          custo_fixo_outros_r?: number | null
          custo_fixo_racao_kg?: number | null
          custo_ms_dia_racao_kg?: number | null
          custo_ms_total?: number | null
          depr_r?: number | null
          desp_var_r?: number | null
          diaria_r_por_cab_dia?: number | null
          dias_cocho?: number | null
          dieta: string
          end_validity?: string | null
          faixa_label?: string | null
          fin_r?: number | null
          frete_r?: number | null
          ganho_arroba_por_kg?: number | null
          gmd_kg_dia?: number | null
          id?: string
          is_active?: boolean | null
          modalidade: string
          mortes_pct?: number | null
          pct_pv?: number | null
          pct_rc?: number | null
          peso_ate_kg?: number | null
          peso_carc_kg?: number | null
          peso_de_kg?: number | null
          peso_gancho_arroba?: number | null
          peso_medio_kg?: number | null
          peso_saida_carc_kg?: number | null
          peso_saida_kg?: number | null
          prod_arroba?: number | null
          rejeito_pct?: number | null
          sanitario_pct?: number | null
          spread_margem?: number | null
          start_validity?: string | null
          tabela_base_r_por_arroba?: number | null
          tabela_final_r_por_arroba?: number | null
          tipo_animal: string
          unit_code: string
          updated_at_table?: string | null
          vigencia_label?: string | null
        }
        Update: {
          bk?: number | null
          break_even_r_por_cab?: number | null
          carc_por_arroba?: number | null
          cf_r?: number | null
          concat_label?: string
          consumo_ms_kg_dia?: number | null
          corp_r?: number | null
          created_at?: string | null
          created_by?: string | null
          ctr_r?: number | null
          custo_ajuste_racao_kg?: number | null
          custo_alimentar?: number | null
          custo_fixo_outros_r?: number | null
          custo_fixo_racao_kg?: number | null
          custo_ms_dia_racao_kg?: number | null
          custo_ms_total?: number | null
          depr_r?: number | null
          desp_var_r?: number | null
          diaria_r_por_cab_dia?: number | null
          dias_cocho?: number | null
          dieta?: string
          end_validity?: string | null
          faixa_label?: string | null
          fin_r?: number | null
          frete_r?: number | null
          ganho_arroba_por_kg?: number | null
          gmd_kg_dia?: number | null
          id?: string
          is_active?: boolean | null
          modalidade?: string
          mortes_pct?: number | null
          pct_pv?: number | null
          pct_rc?: number | null
          peso_ate_kg?: number | null
          peso_carc_kg?: number | null
          peso_de_kg?: number | null
          peso_gancho_arroba?: number | null
          peso_medio_kg?: number | null
          peso_saida_carc_kg?: number | null
          peso_saida_kg?: number | null
          prod_arroba?: number | null
          rejeito_pct?: number | null
          sanitario_pct?: number | null
          spread_margem?: number | null
          start_validity?: string | null
          tabela_base_r_por_arroba?: number | null
          tabela_final_r_por_arroba?: number | null
          tipo_animal?: string
          unit_code?: string
          updated_at_table?: string | null
          vigencia_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_price_matrix_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_price_matrix_unit_code_fkey"
            columns: ["unit_code"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["code"]
          },
        ]
      }
      units: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string | null
          state: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string | null
          state?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
