import { z } from 'zod';

export const businessDataSchema = z.object({
  // Identification
  pecuarista: z.string().min(1, 'Pecuarista é obrigatório'),
  originator_id: z.string().uuid('Originador inválido'),
  negotiation_date: z.date(),
  unit_code: z.string().min(1, 'Unidade é obrigatória'),
  dieta: z.string().min(1, 'Dieta é obrigatória'),
  scale_type: z.enum(['Fazenda', 'Balanção', 'Balancinha']),
  breakage_farm_pct: z.number().min(0).max(100),
  breakage_scale_pct: z.number().min(0).max(100),
  modalidade: z.enum(['Diária', 'Arroba Prod.']),
  
  // Lot & Weights
  qtd_animais: z.number().min(1, 'Quantidade de animais deve ser maior que zero'),
  tipo_animal: z.string().min(1, 'Tipo de animal é obrigatório'),
  peso_fazenda_kg: z.number().min(0).optional(),
  peso_entrada_balancao_kg: z.number().min(0).optional(),
  peso_ajustado_balancinha_kg: z.number().min(0).optional(),
  
  // Market
  lean_cattle_yield_at: z.number().min(0).max(1),
  price_lean_r_per_at: z.number().min(0),
  price_fat_r_per_at: z.number().min(0),
  agio_r: z.number(),
});

export const simulationFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  
  // Animal & Performance
  entry_weight_kg: z.number().min(1, 'Peso de entrada é obrigatório'),
  days_on_feed: z.number().min(1, 'Dias no cocho é obrigatório'),
  adg_kg_day: z.number().min(0, 'GMD deve ser positivo'),
  dmi_pct_bw: z.number().min(0).max(100).optional(),
  dmi_kg_day: z.number().min(0).optional(),
  mortality_pct: z.number().min(0).max(100),
  feed_waste_pct: z.number().min(0).max(100),
  
  // Prices & Costs
  purchase_price_per_at: z.number().min(0).optional(),
  purchase_price_per_kg: z.number().min(0).optional(),
  selling_price_per_at: z.number().min(0, 'Preço de venda é obrigatório'),
  feed_cost_kg_dm: z.number().min(0, 'Custo da ração é obrigatório'),
  health_cost_total: z.number().min(0),
  transport_cost_total: z.number().min(0),
  financial_cost_total: z.number().min(0),
  depreciation_total: z.number().min(0),
  overhead_total: z.number().min(0),
  
  notes: z.string().optional(),
  use_average_weight: z.boolean().optional(),
}).refine(
  (data) => data.purchase_price_per_at || data.purchase_price_per_kg,
  {
    message: 'Preço de compra por @ ou por kg é obrigatório',
    path: ['purchase_price_per_at'],
  }
);

export const completeSimulationSchema = z.object({
  businessData: businessDataSchema,
  formData: simulationFormSchema,
});

export type BusinessDataType = z.infer<typeof businessDataSchema>;
export type SimulationFormType = z.infer<typeof simulationFormSchema>;
export type CompleteSimulationType = z.infer<typeof completeSimulationSchema>;