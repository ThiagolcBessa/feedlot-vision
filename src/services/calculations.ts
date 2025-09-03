// Boitel JBS - Feedlot calculation engine
// All formulas for feedlot viability simulation

export interface SimulationInput {
  // Animal & Performance
  entry_weight_kg: number;
  days_on_feed: number;
  adg_kg_day: number;
  dmi_pct_bw?: number;
  dmi_kg_day?: number;
  mortality_pct: number;
  feed_waste_pct: number;

  // Prices & Costs
  purchase_price_per_at?: number;
  purchase_price_per_kg?: number;
  selling_price_per_at: number;
  feed_cost_kg_dm: number;
  health_cost_total: number;
  transport_cost_total: number;
  financial_cost_total: number;
  depreciation_total: number;
  overhead_total: number;

  // Fixed costs from premises
  fixed_cost_daily_per_head?: number;
  admin_overhead_daily_per_head?: number;

  // Constants
  carcass_yield_pct?: number; // Default 53%
}

export interface SimulationResult {
  // Basic calculations
  exit_weight_kg: number;
  carcass_weight_kg: number;
  arroubas_hook: number;
  arroubas_gain: number;
  dmi_kg_day_calculated: number;

  // Costs breakdown
  purchase_cost: number;
  feed_cost_total: number;
  fixed_admin_total: number;
  mortality_cost: number;
  total_cost: number;

  // Revenue
  revenue: number;

  // KPIs
  margin_total: number;
  cost_per_animal: number;
  cost_per_arrouba: number;
  spread_r_per_at: number;
  break_even_r_per_at: number;
  roi_pct: number;
  payback_days: number | null;
}

const ARROUBA_WEIGHT_KG = 15;
const DEFAULT_CARCASS_YIELD = 0.53; // 53%

export function calculateSimulation(input: SimulationInput): SimulationResult {
  // 1. Exit Weight (kg)
  const exit_weight_kg = input.entry_weight_kg + (input.adg_kg_day * input.days_on_feed);

  // 2. Carcass Weight (kg) - using 53% default yield
  const carcass_yield = input.carcass_yield_pct ? input.carcass_yield_pct / 100 : DEFAULT_CARCASS_YIELD;
  const carcass_weight_kg = exit_weight_kg * carcass_yield;

  // 3. Arroubas Hook (@)
  const arroubas_hook = carcass_weight_kg / ARROUBA_WEIGHT_KG;

  // 4. Arroubas Gain (@)
  const arroubas_gain = (exit_weight_kg - input.entry_weight_kg) / ARROUBA_WEIGHT_KG;

  // 5. DMI kg/day (if not provided, calculate from % of body weight)
  const dmi_kg_day_calculated = input.dmi_kg_day || 
    ((input.entry_weight_kg + exit_weight_kg) / 2) * (input.dmi_pct_bw || 2.5) / 100;

  // 6. Feed Cost Total
  const feed_cost_total = 
    (dmi_kg_day_calculated * input.days_on_feed * input.feed_cost_kg_dm) * 
    (1 + input.feed_waste_pct / 100);

  // 7. Fixed & Overhead (from premises)
  const fixed_admin_total = 
    ((input.fixed_cost_daily_per_head || 0) + (input.admin_overhead_daily_per_head || 0)) * 
    input.days_on_feed;

  // 8. Purchase Cost
  let purchase_cost = 0;
  if (input.purchase_price_per_at) {
    purchase_cost = (input.entry_weight_kg / ARROUBA_WEIGHT_KG) * input.purchase_price_per_at;
  } else if (input.purchase_price_per_kg) {
    purchase_cost = input.entry_weight_kg * input.purchase_price_per_kg;
  }

  // 9. Revenue
  const revenue = arroubas_hook * input.selling_price_per_at;

  // 10. Mortality cost (simple proxy - % of purchase cost)
  const mortality_cost = purchase_cost * (input.mortality_pct / 100);

  // 11. Total Cost
  const total_cost = 
    purchase_cost + 
    feed_cost_total + 
    input.health_cost_total + 
    input.transport_cost_total + 
    input.financial_cost_total + 
    input.depreciation_total + 
    input.overhead_total + 
    fixed_admin_total + 
    mortality_cost;

  // 12. Margin Total
  const margin_total = revenue - total_cost;

  // 13. Cost per Animal / per @
  const cost_per_animal = total_cost;
  const cost_per_arrouba = total_cost / Math.max(arroubas_hook, 0.0001);

  // 14. Spread (R$/@)
  const spread_r_per_at = input.selling_price_per_at - cost_per_arrouba;

  // 15. Break-even (R$/@)
  const break_even_r_per_at = cost_per_arrouba;

  // 16. ROI %
  const roi_pct = (margin_total / total_cost) * 100;

  // 17. Payback (days) - approximate
  const payback_days = margin_total > 0 
    ? (total_cost / (margin_total / input.days_on_feed)) 
    : null;

  return {
    // Basic calculations
    exit_weight_kg: Number(exit_weight_kg.toFixed(2)),
    carcass_weight_kg: Number(carcass_weight_kg.toFixed(2)),
    arroubas_hook: Number(arroubas_hook.toFixed(2)),
    arroubas_gain: Number(arroubas_gain.toFixed(2)),
    dmi_kg_day_calculated: Number(dmi_kg_day_calculated.toFixed(2)),

    // Costs breakdown
    purchase_cost: Number(purchase_cost.toFixed(2)),
    feed_cost_total: Number(feed_cost_total.toFixed(2)),
    fixed_admin_total: Number(fixed_admin_total.toFixed(2)),
    mortality_cost: Number(mortality_cost.toFixed(2)),
    total_cost: Number(total_cost.toFixed(2)),

    // Revenue
    revenue: Number(revenue.toFixed(2)),

    // KPIs
    margin_total: Number(margin_total.toFixed(2)),
    cost_per_animal: Number(cost_per_animal.toFixed(2)),
    cost_per_arrouba: Number(cost_per_arrouba.toFixed(2)),
    spread_r_per_at: Number(spread_r_per_at.toFixed(2)),
    break_even_r_per_at: Number(break_even_r_per_at.toFixed(2)),
    roi_pct: Number(roi_pct.toFixed(2)),
    payback_days: payback_days ? Number(payback_days.toFixed(1)) : null,
  };
}

// Helper function to format currency in Brazilian Real
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Helper function to format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Helper function to format weight
export function formatWeight(value: number): string {
  return `${value.toFixed(2)} kg`;
}

// Helper function to format arroubas
export function formatArroubas(value: number): string {
  return `${value.toFixed(2)} @`;
}