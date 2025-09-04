import { supabase } from '@/integrations/supabase/client';
import { calculateSimulation } from '@/services/calculations';
import { simulationSchema, type SimulationFormType } from '@/schemas/simulationSchema';

export interface SaveResult {
  success: boolean;
  simulationId?: string;
  negotiationId?: string;
  error?: string;
}

export class SaveOrchestrator {
  private createdRecords: {
    negotiationId?: string;
    simulationId?: string;
    resultId?: string;
  } = {};

  async saveSimulation(
    formData: SimulationFormType,
    premises?: any,
    isEditing = false,
    existingSimulationId?: string
  ): Promise<SaveResult> {
    try {
      // Step 1: Validate all fields
      const validationResult = simulationSchema.safeParse(formData);

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return {
          success: false,
          error: `Validation errors: ${errors}`
        };
      }

      // Step 2: Re-run calculation locally to ensure consistency
      const calculationInput = this.buildCalculationInput(formData, premises);
      const calculationResult = calculateSimulation(calculationInput);

      if (!calculationResult) {
        return {
          success: false,
          error: 'Calculation failed. Please check your inputs.'
        };
      }

      // Step 3: Upsert negotiations table
      const negotiationId = await this.upsertNegotiation(formData, isEditing);
      if (!negotiationId) {
        throw new Error('Failed to create/update negotiation');
      }
      
      if (!isEditing) {
        this.createdRecords.negotiationId = negotiationId;
      }

      // Step 4: Upsert simulations table
      const simulationId = await this.upsertSimulation(
        formData,
        negotiationId,
        isEditing,
        existingSimulationId
      );
      if (!simulationId) {
        throw new Error('Failed to create/update simulation');
      }
      
      if (!isEditing) {
        this.createdRecords.simulationId = simulationId;
      }

      // Step 5: Insert snapshot into simulation_results
      const resultId = await this.insertSimulationResult(simulationId, calculationResult, isEditing);
      if (!resultId) {
        throw new Error('Failed to save simulation results');
      }
      
      if (!isEditing) {
        this.createdRecords.resultId = resultId;
      }

      return {
        success: true,
        simulationId,
        negotiationId
      };

    } catch (error) {
      console.error('Save orchestrator error:', error);
      
      // Roll back newly created records
      if (!isEditing) {
        await this.rollback();
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private buildCalculationInput(formData: SimulationFormType, premises?: any) {
    // Map new schema fields to calculation input
    return {
      entry_weight_kg: formData.peso_fazenda_kg || formData.peso_entrada_balancao_kg || formData.peso_entrada_balancinha_kg || 0,
      days_on_feed: formData.dias_cocho || 0,
      adg_kg_day: formData.gmd_kg_dia || 0,
      dmi_pct_bw: 2.5, // Default value 
      dmi_kg_day: formData.dmi_kg_dia,
      mortality_pct: 2.0, // Default value
      feed_waste_pct: 5.0, // Default value
      purchase_price_per_at: formData.preco_boi_magro_r_por_arroba,
      purchase_price_per_kg: undefined,
      selling_price_per_at: formData.preco_boi_gordo_r_por_arroba || 0,
      feed_cost_kg_dm: formData.custo_ms_kg || 0,
      health_cost_total: 0, // Default value
      transport_cost_total: 0, // Default value 
      financial_cost_total: 0, // Default value
      depreciation_total: 0, // Default value
      overhead_total: 0, // Default value
      fixed_cost_daily_per_head: premises?.fixed_cost_daily_per_head || 0,
      admin_overhead_daily_per_head: premises?.admin_overhead_daily_per_head || 0,
      carcass_yield_pct: formData.rc_pct ? formData.rc_pct * 100 : premises?.carcass_yield_pct || 53,
      use_average_weight: true,
    };
  }

  private async upsertNegotiation(formData: SimulationFormType, isEditing: boolean): Promise<string | null> {
    try {
      // Map unified form data to negotiations table structure
      const negotiationData = {
        pecuarista_name: formData.pecuarista_name,
        originator_id: formData.originator_id,
        date_ref: formData.date_ref,
        unit_code: formData.unit_code,
        dieta: formData.dieta,
        scale_type: formData.scale_type,
        modalidade: formData.modalidade,
        
        // Service prices - conditional based on modalidade
        price_r_por_arroba: formData.modalidade === 'Arroba Prod.' ? formData.service_price : null,
        daily_r_por_cab: formData.modalidade === 'Diária' ? formData.service_price : null,
        concat_label: formData.concat_label,
        
        // Default freight/tax values - can be enhanced later
        frete_confinamento_r: 0,
        frete_pecuarista_r: 0,
        icms_devolucao_r: 0,
        taxa_abate_r: 0,
        
        // Lot data
        qtd_animais: formData.qtd_animais,
        tipo_animal: formData.tipo_animal,
        peso_fazenda_kg: formData.peso_fazenda_kg,
        peso_entrada_balancao_kg: formData.peso_entrada_balancao_kg,
        peso_entrada_balancinha_kg: formData.peso_entrada_balancinha_kg,
        
        // Breakages (stored as fractions)
        quebra_fazenda_pct: formData.quebra_fazenda_pct,
        quebra_balanca_pct: formData.quebra_balanca_pct,
        
        // Zootechnical
        dias_cocho: formData.dias_cocho,
        gmd_kg_dia: formData.gmd_kg_dia,
        rc_pct: formData.rc_pct,
        dmi_kg_dia: formData.dmi_kg_dia,
        custo_ms_kg: formData.custo_ms_kg,
        
        // Market
        rendimento_boi_magro_prod_pct: formData.rendimento_boi_magro_prod_pct,
        preco_boi_magro_r_por_arroba: formData.preco_boi_magro_r_por_arroba,
        preco_boi_gordo_r_por_arroba: formData.preco_boi_gordo_r_por_arroba,
        agio_magro_r: formData.agio_magro_r,
      };

      // Use raw insert with any type since negotiations table exists but isn't typed
      const { data, error } = await (supabase as any)
        .from('negotiations')
        .insert(negotiationData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating negotiation:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Exception in upsertNegotiation:', error);
      return null;
    }
  }

  private async upsertSimulation(
    formData: SimulationFormType,
    negotiationId: string,
    isEditing: boolean,
    existingSimulationId?: string
  ): Promise<string | null> {
    // Map minimal simulation data - most data is now in negotiations table
    const simulationData = {
      title: formData.title || 'Simulação sem título',
      negotiation_id: negotiationId,
      entry_weight_kg: formData.peso_fazenda_kg || formData.peso_entrada_balancao_kg || formData.peso_entrada_balancinha_kg || 0,
      days_on_feed: formData.dias_cocho || 0,
      adg_kg_day: formData.gmd_kg_dia || 0,
      dmi_pct_bw: 2.5, // Default
      dmi_kg_day: formData.dmi_kg_dia,
      purchase_price_per_at: formData.preco_boi_magro_r_por_arroba,
      purchase_price_per_kg: undefined,
      selling_price_per_at: formData.preco_boi_gordo_r_por_arroba || 0,
      feed_cost_kg_dm: formData.custo_ms_kg || 0,
      health_cost_total: 0, // Default
      transport_cost_total: 0, // Default
      financial_cost_total: 0, // Default
      depreciation_total: 0, // Default
      overhead_total: 0, // Default
      feed_waste_pct: 5.0, // Default
      mortality_pct: 2.0, // Default
      notes: formData.notes,
    };

    if (isEditing && existingSimulationId) {
      const { data, error } = await supabase
        .from('simulations')
        .update(simulationData as any)
        .eq('id', existingSimulationId)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating simulation:', error);
        return null;
      }
      
      return data?.id || null;
    } else {
      const { data, error } = await supabase
        .from('simulations')
        .insert(simulationData as any)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error inserting simulation:', error);
        return null;
      }
      
      return data?.id || null;
    }
  }

  private async insertSimulationResult(
    simulationId: string,
    calculationResult: any,
    isEditing: boolean
  ): Promise<string | null> {
    // Delete existing results if editing
    if (isEditing) {
      await supabase
        .from('simulation_results')
        .delete()
        .eq('simulation_id', simulationId);
    }

    const resultData = {
      simulation_id: simulationId,
      exit_weight_kg: calculationResult.exit_weight_kg,
      carcass_weight_kg: calculationResult.carcass_weight_kg,
      arroubas_hook: calculationResult.arroubas_hook,
      arroubas_gain: calculationResult.arroubas_gain,
      cost_per_animal: calculationResult.cost_per_animal,
      cost_per_arrouba: calculationResult.cost_per_arrouba,
      margin_total: calculationResult.margin_total,
      spread_r_per_at: calculationResult.spread_r_per_at,
      break_even_r_per_at: calculationResult.break_even_r_per_at,
      roi_pct: calculationResult.roi_pct,
      payback_days: calculationResult.payback_days,
    };

    const { data, error } = await supabase
      .from('simulation_results')
      .insert(resultData)
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting simulation result:', error);
      return null;
    }

    return data?.id || null;
  }

  private async rollback() {
    console.log('Rolling back created records:', this.createdRecords);
    
    // Delete in reverse order of creation
    if (this.createdRecords.resultId) {
      await supabase
        .from('simulation_results')
        .delete()
        .eq('id', this.createdRecords.resultId);
    }

    if (this.createdRecords.simulationId) {
      await supabase
        .from('simulations')
        .delete()
        .eq('id', this.createdRecords.simulationId);
    }

    // Skip negotiation cleanup since it's mocked
    // if (this.createdRecords.negotiationId) {
    //   await supabase
    //     .from('negotiations')
    //     .delete()
    //     .eq('id', this.createdRecords.negotiationId);
    // }

    // Clear tracked records
    this.createdRecords = {};
  }
}