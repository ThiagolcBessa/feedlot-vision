// Boitel JBS - Feedlot calculation engine
// Enhanced to support negotiation data and pricing matrix integration

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
  carcass_yield_pct?: number; // From premises, default 53%
  use_average_weight?: boolean; // DMI calculation method

  // NEW: Negotiation data integration
  negotiation?: {
    modalidade?: string;
    service_price?: number;
    qtd_animais?: number;
    quebra_fazenda_pct?: number;
    quebra_balanca_pct?: number;
    agio_magro_r?: number;
    rendimento_boi_magro_prod_pct?: number;
    preco_boi_magro_r_por_arroba?: number;
  };
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

  // Revenue (enhanced with modality handling)
  revenue: number;
  service_revenue?: number; // For engorda service

  // NEW: DRE Pecuarista
  dre_pecuarista?: {
    revenue_fat_cattle: number;
    cost_lean_cattle: number;
    cost_fattening_service: number;
    fees_freight: number;
    result_per_head: number;
    result_per_lot: number;
    cost_per_arroba_produced: number;
    result_per_arroba_magro: number;
    monthly_return_pct: number;
  };

  // NEW: DRE JBS
  dre_jbs?: {
    service_revenue: number;
    feed_costs: number;
    freight_costs: number;
    sanitary_mortality: number;
    ctr_costs: number;
    cf_costs: number;
    corp_costs: number;
    depreciation: number;
    financial: number;
    other_fixed: number;
    result_jbs: number;
    result_per_arroba: number;
  };

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

  // 2. Carcass Weight (kg) - using premises carcass yield or default 53%
  const carcass_yield = input.carcass_yield_pct ? input.carcass_yield_pct / 100 : DEFAULT_CARCASS_YIELD;
  const carcass_weight_kg = exit_weight_kg * carcass_yield;

  // 3. Arroubas Hook (@)
  const arroubas_hook = carcass_weight_kg / ARROUBA_WEIGHT_KG;

  // 4. Arroubas Gain (@)
  const arroubas_gain = (exit_weight_kg - input.entry_weight_kg) / ARROUBA_WEIGHT_KG;

  // 5. @ Magro (lean cattle arroubas)
  const arroubas_magro = input.entry_weight_kg / ARROUBA_WEIGHT_KG;

  // 6. DMI kg/day calculation with method selection
  let dmi_kg_day_calculated: number;
  
  if (input.dmi_kg_day) {
    // Direct DMI provided
    dmi_kg_day_calculated = input.dmi_kg_day;
  } else {
    // Calculate from % of body weight
    const dmi_pct_bw = input.dmi_pct_bw || 2.5;
    
    if (input.use_average_weight) {
      // Use average body weight (recommended)
      const avg_weight_kg = (input.entry_weight_kg + exit_weight_kg) / 2;
      dmi_kg_day_calculated = avg_weight_kg * (dmi_pct_bw / 100);
    } else {
      // Use exit weight (original method)
      dmi_kg_day_calculated = exit_weight_kg * (dmi_pct_bw / 100);
    }
  }

  // 7. Feed Cost Total
  const feed_cost_total = 
    (dmi_kg_day_calculated * input.days_on_feed * input.feed_cost_kg_dm) * 
    (1 + input.feed_waste_pct / 100);

  // 8. Fixed & Overhead (from premises)
  const fixed_admin_total = 
    ((input.fixed_cost_daily_per_head || 0) + (input.admin_overhead_daily_per_head || 0)) * 
    input.days_on_feed;

  // 9. Purchase Cost
  let purchase_cost = 0;
  if (input.purchase_price_per_at) {
    purchase_cost = (input.entry_weight_kg / ARROUBA_WEIGHT_KG) * input.purchase_price_per_at;
  } else if (input.purchase_price_per_kg) {
    purchase_cost = input.entry_weight_kg * input.purchase_price_per_kg;
  }

  // 10. Service Revenue/Cost calculation based on modality
  let service_revenue = 0;
  if (input.negotiation?.modalidade && input.negotiation?.service_price) {
    if (input.negotiation.modalidade === 'Arroba Prod.') {
      // Service price per arroba gained
      service_revenue = arroubas_gain * input.negotiation.service_price;
    } else if (input.negotiation.modalidade === 'Diária') {
      // Service price per head per day
      service_revenue = input.days_on_feed * input.negotiation.service_price;
    }
  }

  // 11. Revenue (standard calculation)
  const revenue = arroubas_hook * input.selling_price_per_at;

  // 12. Mortality cost (simple proxy - % of purchase cost)
  const mortality_cost = purchase_cost * (input.mortality_pct / 100);

  // 13. Total Cost (traditional)
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

  // 14. DRE Pecuarista (rancher's perspective)
  let dre_pecuarista: SimulationResult['dre_pecuarista'];
  if (input.negotiation && input.negotiation.qtd_animais) {
    const qty = input.negotiation.qtd_animais;
    
    // Revenue from selling fat cattle
    const revenue_fat_cattle = arroubas_hook * input.selling_price_per_at * qty;
    
    // Cost of lean cattle
    let cost_lean_cattle = 0;
    if (input.negotiation.preco_boi_magro_r_por_arroba) {
      cost_lean_cattle = arroubas_magro * input.negotiation.preco_boi_magro_r_por_arroba * qty;
      if (input.negotiation.agio_magro_r) {
        cost_lean_cattle += input.negotiation.agio_magro_r * qty;
      }
    }
    
    // Fattening service cost
    const cost_fattening_service = service_revenue * qty;
    
    // Fees and freight (simplified)
    const fees_freight = (input.transport_cost_total || 0) * qty;
    
    // Results
    const result_per_head = revenue_fat_cattle - cost_lean_cattle - cost_fattening_service - fees_freight;
    const result_per_lot = result_per_head;
    const cost_per_arroba_produced = (cost_lean_cattle + cost_fattening_service + fees_freight) / (arroubas_gain * qty);
    const result_per_arroba_magro = result_per_head / arroubas_magro;
    const monthly_return_pct = (result_per_head / cost_lean_cattle) * (30 / input.days_on_feed) * 100;
    
    dre_pecuarista = {
      revenue_fat_cattle,
      cost_lean_cattle,
      cost_fattening_service,
      fees_freight,
      result_per_head: result_per_head / qty,
      result_per_lot,
      cost_per_arroba_produced,
      result_per_arroba_magro,
      monthly_return_pct,
    };
  }

  // 15. DRE JBS (feedlot operator perspective)
  let dre_jbs: SimulationResult['dre_jbs'];
  if (input.negotiation && service_revenue > 0) {
    const result_jbs = service_revenue - feed_cost_total - fixed_admin_total - mortality_cost;
    const result_per_arroba = result_jbs / arroubas_gain;
    
    dre_jbs = {
      service_revenue,
      feed_costs: feed_cost_total,
      freight_costs: input.transport_cost_total,
      sanitary_mortality: input.health_cost_total + mortality_cost,
      ctr_costs: 0, // Would come from negotiation/matrix data
      cf_costs: fixed_admin_total,
      corp_costs: input.overhead_total,
      depreciation: input.depreciation_total,
      financial: input.financial_cost_total,
      other_fixed: 0,
      result_jbs,
      result_per_arroba,
    };
  }

  // 16. Margin Total (traditional calculation)
  const margin_total = revenue - total_cost;

  // 17. Cost per Animal / per @
  const cost_per_animal = total_cost;
  const cost_per_arrouba = total_cost / Math.max(arroubas_hook, 0.0001);

  // 18. Spread (R$/@)
  const spread_r_per_at = input.selling_price_per_at - cost_per_arrouba;

  // 19. Break-even (R$/@)
  const break_even_r_per_at = cost_per_arrouba;

  // 20. ROI %
  const roi_pct = (margin_total / total_cost) * 100;

  // 21. Payback (days) - approximate
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
    service_revenue: service_revenue ? Number(service_revenue.toFixed(2)) : undefined,

    // DREs
    dre_pecuarista: dre_pecuarista ? {
      ...dre_pecuarista,
      revenue_fat_cattle: Number(dre_pecuarista.revenue_fat_cattle.toFixed(2)),
      cost_lean_cattle: Number(dre_pecuarista.cost_lean_cattle.toFixed(2)),
      cost_fattening_service: Number(dre_pecuarista.cost_fattening_service.toFixed(2)),
      fees_freight: Number(dre_pecuarista.fees_freight.toFixed(2)),
      result_per_head: Number(dre_pecuarista.result_per_head.toFixed(2)),
      result_per_lot: Number(dre_pecuarista.result_per_lot.toFixed(2)),
      cost_per_arroba_produced: Number(dre_pecuarista.cost_per_arroba_produced.toFixed(2)),
      result_per_arroba_magro: Number(dre_pecuarista.result_per_arroba_magro.toFixed(2)),
      monthly_return_pct: Number(dre_pecuarista.monthly_return_pct.toFixed(2)),
    } : undefined,
    dre_jbs: dre_jbs ? {
      ...dre_jbs,
      service_revenue: Number(dre_jbs.service_revenue.toFixed(2)),
      feed_costs: Number(dre_jbs.feed_costs.toFixed(2)),
      freight_costs: Number(dre_jbs.freight_costs.toFixed(2)),
      sanitary_mortality: Number(dre_jbs.sanitary_mortality.toFixed(2)),
      ctr_costs: Number(dre_jbs.ctr_costs.toFixed(2)),
      cf_costs: Number(dre_jbs.cf_costs.toFixed(2)),
      corp_costs: Number(dre_jbs.corp_costs.toFixed(2)),
      depreciation: Number(dre_jbs.depreciation.toFixed(2)),
      financial: Number(dre_jbs.financial.toFixed(2)),
      other_fixed: Number(dre_jbs.other_fixed.toFixed(2)),
      result_jbs: Number(dre_jbs.result_jbs.toFixed(2)),
      result_per_arroba: Number(dre_jbs.result_per_arroba.toFixed(2)),
    } : undefined,

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

/**
 * Enhanced sensitivity analysis with double dimensions
 * Recalculates full simulation for each delta
 */
export interface SensitivityAnalysis {
  scenario: string;
  price_delta: number;
  feed_delta: number;
  margin: number;
  spread: number;
  break_even: number;
  roi: number;
}

export function calculateDoubleSensitivity(
  baseInput: SimulationInput,
  priceDelta: number,
  feedDelta: number
): SensitivityAnalysis {
  // Create modified input with deltas applied
  const modifiedInput: SimulationInput = {
    ...baseInput,
    selling_price_per_at: baseInput.selling_price_per_at * (1 + priceDelta / 100),
    feed_cost_kg_dm: baseInput.feed_cost_kg_dm * (1 + feedDelta / 100),
  };

  // Recalculate full simulation
  const result = calculateSimulation(modifiedInput);

  const priceSign = priceDelta >= 0 ? '+' : '';
  const feedSign = feedDelta >= 0 ? '+' : '';
  const scenario = `Venda ${priceSign}${priceDelta}% | Ração ${feedSign}${feedDelta}%`;

  return {
    scenario,
    price_delta: priceDelta,
    feed_delta: feedDelta,
    margin: result.margin_total,
    spread: result.spread_r_per_at,
    break_even: result.break_even_r_per_at,
    roi: result.roi_pct,
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