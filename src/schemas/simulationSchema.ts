import { z } from 'zod';

// Unified simulation schema with all fields in one form
export const simulationSchema = z.object({
  // Optional title field
  title: z.string().optional(),
  
  // IDENTIFICAÇÃO
  pecuarista_name: z.string().min(1, 'Pecuarista é obrigatório'),
  originator_id: z.string().uuid('Originador inválido'),
  date_ref: z.date(),
  unit_id: z.string().uuid('Unidade inválida').optional(),
  unit_code: z.string().min(1, 'Unidade é obrigatória'),
  dieta: z.string().min(1, 'Dieta é obrigatória'),
  scale_type: z.enum(['Fazenda', 'Balanção', 'Balancinha']),
  modalidade: z.enum(['Diária', 'Arroba Prod.']),
  quebra_fazenda_pct: z.number().min(0).max(1), // Store as fraction (0.08 = 8%)
  quebra_balanca_pct: z.number().min(0).max(1), // Store as fraction (0.01 = 1%)
  
  // LOTE & PESOS
  qtd_animais: z.number().min(1, 'Quantidade de animais deve ser maior que zero'),
  tipo_animal: z.string().min(1, 'Tipo de animal é obrigatório'),
  peso_fazenda_kg: z.number().min(0).optional(),
  peso_entrada_balancao_kg: z.number().min(0).optional(),
  peso_entrada_balancinha_kg: z.number().min(0).optional(),
  
  // ZOOTÉCNICOS
  dias_cocho: z.number().min(1, 'Dias no cocho é obrigatório'),
  gmd_kg_dia: z.number().min(0, 'GMD deve ser positivo'),
  rc_pct: z.number().min(0).max(1), // Store as fraction (0.55 = 55%)
  dmi_kg_dia: z.number().min(0).optional(),
  pct_pv: z.number().min(0).max(1).optional(), // % of body weight for DMI calculation
  custo_ms_kg: z.number().min(0, 'Custo da MS é obrigatório'),
  desperdicio_ms_pct: z.number().min(0).max(1).optional(), // Feed waste % as fraction
  
  // MERCADO
  rendimento_boi_magro_prod_pct: z.number().min(0).max(1).default(0.50), // Store as fraction (0.50 = 50%)
  preco_boi_magro_r_por_arroba: z.number().min(0, 'Preço boi magro é obrigatório'),
  preco_boi_gordo_r_por_arroba: z.number().min(0, 'Preço boi gordo é obrigatório'),
  agio_magro_r: z.number(),
  
  // Read-only fields (from matrix lookup)
  price_base_r_por_arroba: z.number().optional(),
  service_price: z.number().optional(), // R$/@ or R$/cab/dia depending on modalidade
  concat_label: z.string().optional(),
  
  notes: z.string().optional(),
});

export type SimulationFormType = z.infer<typeof simulationSchema>;

// For backwards compatibility, keep the old types but mark as deprecated
/** @deprecated Use SimulationFormType instead */
export type BusinessDataType = {
  pecuarista_name: string;
  originator_id: string;
  date_ref: Date;
  unit_code: string;
  dieta: string;
  scale_type: 'Fazenda' | 'Balanção' | 'Balancinha';
  modalidade: 'Diária' | 'Arroba Prod.';
  quebra_fazenda_pct: number;
  quebra_balanca_pct: number;
  qtd_animais: number;
  tipo_animal: string;
  peso_fazenda_kg?: number;
  peso_entrada_balancao_kg?: number;
  peso_entrada_balancinha_kg?: number;
  rendimento_boi_magro_prod_pct: number;
  preco_boi_magro_r_por_arroba: number;
  preco_boi_gordo_r_por_arroba: number;
  agio_magro_r: number;
};

/** @deprecated Use simulationSchema instead */
export const completeSimulationSchema = simulationSchema;