import { useMemo } from 'react';
import { calculateSimulation, SimulationInput, SimulationResult } from '@/services/calculations';

export interface UseSimCalculatorProps {
  input: Partial<SimulationInput>;
  premises?: {
    carcass_yield_pct?: number;
    fixed_cost_daily_per_head?: number;
    admin_overhead_daily_per_head?: number;
  };
}

export function useSimCalculator({ input, premises }: UseSimCalculatorProps) {
  const result = useMemo(() => {
    // Check if we have the minimum required inputs
    const hasMinimumInputs = 
      input.entry_weight_kg &&
      input.days_on_feed &&
      input.adg_kg_day &&
      input.selling_price_per_at &&
      input.feed_cost_kg_dm &&
      (input.purchase_price_per_at || input.purchase_price_per_kg);

    if (!hasMinimumInputs) {
      return null;
    }

    // Build complete simulation input with defaults
    const completeInput: SimulationInput = {
      // Animal & Performance
      entry_weight_kg: input.entry_weight_kg!,
      days_on_feed: input.days_on_feed!,
      adg_kg_day: input.adg_kg_day!,
      dmi_pct_bw: input.dmi_pct_bw || 2.5,
      dmi_kg_day: input.dmi_kg_day,
      mortality_pct: input.mortality_pct || 2.0,
      feed_waste_pct: input.feed_waste_pct || 5.0,

      // Prices & Costs
      purchase_price_per_at: input.purchase_price_per_at,
      purchase_price_per_kg: input.purchase_price_per_kg,
      selling_price_per_at: input.selling_price_per_at!,
      feed_cost_kg_dm: input.feed_cost_kg_dm!,
      health_cost_total: input.health_cost_total || 0,
      transport_cost_total: input.transport_cost_total || 0,
      financial_cost_total: input.financial_cost_total || 0,
      depreciation_total: input.depreciation_total || 0,
      overhead_total: input.overhead_total || 0,

      // From premises
      fixed_cost_daily_per_head: premises?.fixed_cost_daily_per_head || 0,
      admin_overhead_daily_per_head: premises?.admin_overhead_daily_per_head || 0,
      carcass_yield_pct: premises?.carcass_yield_pct || 53, // Default 53%

      // Method selection
      use_average_weight: input.use_average_weight ?? true, // Default to recommended method
    };

    try {
      return calculateSimulation(completeInput);
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, [input, premises]);

  const isValid = result !== null;

  return {
    result,
    isValid,
    hasMinimumInputs: Boolean(
      input.entry_weight_kg &&
      input.days_on_feed &&
      input.adg_kg_day &&
      input.selling_price_per_at &&
      input.feed_cost_kg_dm &&
      (input.purchase_price_per_at || input.purchase_price_per_kg)
    ),
  };
}