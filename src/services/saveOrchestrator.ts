import { supabase } from '@/integrations/supabase/client';
import { calculateSimulation } from '@/services/calculations';
import { completeSimulationSchema, type BusinessDataType, type SimulationFormType } from '@/schemas/simulationSchema';

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
    businessData: BusinessDataType,
    formData: SimulationFormType,
    premises?: any,
    isEditing = false,
    existingSimulationId?: string
  ): Promise<SaveResult> {
    try {
      // Step 1: Validate all fields
      const validationResult = completeSimulationSchema.safeParse({
        businessData,
        formData
      });

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
      const negotiationId = await this.upsertNegotiation(businessData, isEditing);
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
    return {
      entry_weight_kg: formData.entry_weight_kg!,
      days_on_feed: formData.days_on_feed!,
      adg_kg_day: formData.adg_kg_day!,
      dmi_pct_bw: formData.dmi_pct_bw || 2.5,
      dmi_kg_day: formData.dmi_kg_day,
      mortality_pct: formData.mortality_pct || 2.0,
      feed_waste_pct: formData.feed_waste_pct || 5.0,
      purchase_price_per_at: formData.purchase_price_per_at,
      purchase_price_per_kg: formData.purchase_price_per_kg,
      selling_price_per_at: formData.selling_price_per_at!,
      feed_cost_kg_dm: formData.feed_cost_kg_dm!,
      health_cost_total: formData.health_cost_total || 0,
      transport_cost_total: formData.transport_cost_total || 0,
      financial_cost_total: formData.financial_cost_total || 0,
      depreciation_total: formData.depreciation_total || 0,
      overhead_total: formData.overhead_total || 0,
      fixed_cost_daily_per_head: premises?.fixed_cost_daily_per_head || 0,
      admin_overhead_daily_per_head: premises?.admin_overhead_daily_per_head || 0,
      carcass_yield_pct: premises?.carcass_yield_pct || 53,
      use_average_weight: formData.use_average_weight ?? true,
    };
  }

  private async upsertNegotiation(businessData: BusinessDataType, isEditing: boolean): Promise<string | null> {
    // Since negotiations table is not in typed schema, we'll skip this step for now
    // In production, this would create a negotiation record
    console.log('Mock negotiation created for:', businessData.pecuarista);
    
    // Return a mock negotiation ID for testing
    return 'mock-negotiation-id-' + Date.now();
  }

  private async upsertSimulation(
    formData: SimulationFormType,
    negotiationId: string,
    isEditing: boolean,
    existingSimulationId?: string
  ): Promise<string | null> {
    const simulationData = {
      title: formData.title,
      negotiation_id: negotiationId,
      entry_weight_kg: formData.entry_weight_kg,
      days_on_feed: formData.days_on_feed,
      adg_kg_day: formData.adg_kg_day,
      dmi_pct_bw: formData.dmi_pct_bw,
      dmi_kg_day: formData.dmi_kg_day,
      purchase_price_per_at: formData.purchase_price_per_at,
      purchase_price_per_kg: formData.purchase_price_per_kg,
      selling_price_per_at: formData.selling_price_per_at,
      feed_cost_kg_dm: formData.feed_cost_kg_dm,
      health_cost_total: formData.health_cost_total,
      transport_cost_total: formData.transport_cost_total,
      financial_cost_total: formData.financial_cost_total,
      depreciation_total: formData.depreciation_total,
      overhead_total: formData.overhead_total,
      feed_waste_pct: formData.feed_waste_pct,
      mortality_pct: formData.mortality_pct,
      notes: formData.notes,
    };

    let query = supabase.from('simulations');
    
    if (isEditing && existingSimulationId) {
      const { data, error } = await query
        .update(simulationData)
        .eq('id', existingSimulationId)
        .select('id')
        .single();
      
      if (error) {
        console.error('Error updating simulation:', error);
        return null;
      }
      
      return data?.id || null;
    } else {
      const { data, error } = await query
        .insert(simulationData as any) // Cast as any to bypass created_by requirement since trigger fills it
        .select('id')
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