import type { SimulationFormType } from '@/schemas/simulationSchema';
import type { MatrixSuggestions } from '@/services/unitMatrix';

export interface CalculationInputs {
  formData: SimulationFormType;
  matrixSuggestions: MatrixSuggestions | null;
  
  // User-editable fields
  preco_boi_magro_r_por_arroba: number;
  preco_boi_gordo_r_por_arroba: number;
  agio_magro_r: number;
  frete_confinamento_r?: number;
  frete_pecuarista_r?: number;
  taxa_abate_r?: number;
  icms_devolucao_r?: number;
}

export interface DREPecuaristaData {
  // Revenue
  receita_total: number;
  arrobas_gancho: number;
  preco_boi_gordo: number;
  
  // Costs
  boi_magro_total: number;
  arrobas_magro: number;
  preco_boi_magro: number;
  agio_magro: number;
  
  engorda_service: number;
  
  taxas_frete_total: number;
  taxa_abate: number;
  frete_pecuarista: number;
  icms_devolucao: number;
  
  // Results
  resultado_total: number;
  custo_arroba_produzida: number;
  resultado_por_arroba_magro: number;
  retorno_mensal_pct: number;
  
  // Per head calculations
  receita_por_boi: number;
  boi_magro_por_boi: number;
  engorda_por_boi: number;
  taxas_frete_por_boi: number;
  resultado_por_boi: number;
}

export interface DREBoitelData {
  // Revenue
  receita_service: number;
  receita_por_boi: number;
  
  // Costs
  custo_alimentar_total: number;
  custo_alimentar_por_boi: number;
  dmi_kg_dia: number;
  dias_cocho: number;
  custo_ms_kg: number;
  rejeito_aplicado_pct: number;
  
  frete_confinamento_total: number;
  frete_confinamento_por_boi: number;
  
  sanitario_mortalidade_total: number;
  sanitario_mortalidade_por_boi: number;
  sanitario_pct: number;
  mortalidade_pct: number;
  
  ctr_total: number;
  ctr_por_boi: number;
  
  cf_total: number;
  cf_por_boi: number;
  
  corp_total: number;
  corp_por_boi: number;
  
  depr_total: number;
  depr_por_boi: number;
  
  fin_total: number;
  fin_por_boi: number;
  
  outros_total: number;
  outros_por_boi: number;
  
  // Results
  custo_total: number;
  custo_total_por_boi: number;
  resultado_jbs: number;
  resultado_jbs_por_boi: number;
  resultado_por_arroba: number;
}

export function calculateMatrixDrivenDRE(inputs: CalculationInputs): {
  pecuarista: DREPecuaristaData;
  boitel: DREBoitelData;
} {
  const { formData, matrixSuggestions } = inputs;
  
  if (!matrixSuggestions) {
    throw new Error('Matrix suggestions required for calculation');
  }
  
  // Base parameters from matrix and form
  const qtd_animais = formData.qtd_animais || 0;
  const peso_entrada = formData.peso_fazenda_kg || formData.peso_entrada_balancao_kg || formData.peso_entrada_balancinha_kg || 0;
  const dias_cocho = matrixSuggestions.dias_cocho || 0;
  const gmd_kg_dia = matrixSuggestions.gmd_kg_dia || 0;
  const rc_pct = (matrixSuggestions.pct_rc || 0) / 100; // Convert % to decimal
  const dmi_kg_dia = matrixSuggestions.consumo_ms_kg_dia || 0;
  
  // Calculate weights and arrobas
  const peso_saida = peso_entrada + (dias_cocho * gmd_kg_dia);
  const peso_carcaca = peso_saida * rc_pct;
  const arrobas_gancho = (peso_carcaca / 15) * qtd_animais; // Total arrobas gancho for lot
  const arrobas_magro = (peso_entrada / 15) * qtd_animais; // Total arrobas magro for lot
  const arrobas_gain = arrobas_gancho - arrobas_magro;
  
  // Service price calculation based on modalidade
  let service_price_total = 0;
  if (formData.modalidade === 'Arroba Prod.') {
    service_price_total = arrobas_gain * (matrixSuggestions.service_price || 0);
  } else if (formData.modalidade === 'Diária') {
    service_price_total = dias_cocho * qtd_animais * (matrixSuggestions.service_price || 0);
  }
  
  // User-editable prices
  const preco_boi_gordo = inputs.preco_boi_gordo_r_por_arroba;
  const preco_boi_magro = inputs.preco_boi_magro_r_por_arroba;
  const agio_magro = inputs.agio_magro_r || 0;
  
  // PECUARISTA DRE
  const receita_total = arrobas_gancho * preco_boi_gordo;
  const boi_magro_total = (arrobas_magro * preco_boi_magro) + (qtd_animais * agio_magro);
  const engorda_service = service_price_total;
  
  const taxa_abate = inputs.taxa_abate_r || 0;
  const frete_pecuarista = inputs.frete_pecuarista_r || 0;
  const icms_devolucao = inputs.icms_devolucao_r || 0;
  const taxas_frete_total = taxa_abate + frete_pecuarista + icms_devolucao;
  
  const resultado_total = receita_total - boi_magro_total - engorda_service - taxas_frete_total;
  const custo_arroba_produzida = (boi_magro_total + engorda_service + taxas_frete_total) / arrobas_gain;
  const resultado_por_arroba_magro = resultado_total / arrobas_magro;
  
  // Monthly return calculation (assuming 30 days)
  const investment_per_boi = (preco_boi_magro * peso_entrada / 15) + agio_magro;
  const total_investment = investment_per_boi * qtd_animais;
  const monthly_return = dias_cocho > 0 ? (resultado_total / total_investment) * (30 / dias_cocho) * 100 : 0;
  
  const pecuarista: DREPecuaristaData = {
    receita_total,
    arrobas_gancho,
    preco_boi_gordo,
    
    boi_magro_total,
    arrobas_magro,
    preco_boi_magro,
    agio_magro,
    
    engorda_service,
    
    taxas_frete_total,
    taxa_abate,
    frete_pecuarista,
    icms_devolucao,
    
    resultado_total,
    custo_arroba_produzida,
    resultado_por_arroba_magro,
    retorno_mensal_pct: monthly_return,
    
    // Per head
    receita_por_boi: receita_total / qtd_animais,
    boi_magro_por_boi: boi_magro_total / qtd_animais,
    engorda_por_boi: engorda_service / qtd_animais,
    taxas_frete_por_boi: taxas_frete_total / qtd_animais,
    resultado_por_boi: resultado_total / qtd_animais,
  };
  
  // BOITEL DRE
  const rejeito_pct = (matrixSuggestions.rejeito_pct || 0) / 100;
  const sanitario_pct = (matrixSuggestions.sanitario_pct || 0) / 100;
  const mortalidade_pct = (matrixSuggestions.mortes_pct || 0) / 100;
  
  // Feed costs (DMI × dias × custo_ms × (1 + rejeito%))
  const custo_ms_kg = matrixSuggestions.custo_ms_dia_racao_kg || 0;
  const custo_alimentar_total = dmi_kg_dia * dias_cocho * custo_ms_kg * (1 + rejeito_pct) * qtd_animais;
  
  const frete_confinamento_total = inputs.frete_confinamento_r || 0;
  
  // Sanitary + mortality cost (as % of animal value)
  const valor_boi_entrada = (peso_entrada / 15) * preco_boi_magro;
  const sanitario_mortalidade_total = (sanitario_pct + mortalidade_pct) * valor_boi_entrada * qtd_animais;
  
  // Fixed costs from matrix
  const ctr_total = (matrixSuggestions.ctr_r || 0) * qtd_animais;
  const cf_total = (matrixSuggestions.cf_r || 0) * qtd_animais;
  const corp_total = (matrixSuggestions.corp_r || 0) * qtd_animais;
  const depr_total = (matrixSuggestions.depr_r || 0) * qtd_animais;
  const fin_total = (matrixSuggestions.fin_r || 0) * qtd_animais;
  const outros_total = (matrixSuggestions.custo_fixo_outros_r || 0) * qtd_animais;
  
  const custo_total = custo_alimentar_total + frete_confinamento_total + sanitario_mortalidade_total + 
                      ctr_total + cf_total + corp_total + depr_total + fin_total + outros_total;
  
  const resultado_jbs = service_price_total - custo_total;
  const resultado_por_arroba = arrobas_gain > 0 ? resultado_jbs / arrobas_gain : 0;
  
  const boitel: DREBoitelData = {
    receita_service: service_price_total,
    receita_por_boi: service_price_total / qtd_animais,
    
    custo_alimentar_total,
    custo_alimentar_por_boi: custo_alimentar_total / qtd_animais,
    dmi_kg_dia,
    dias_cocho,
    custo_ms_kg,
    rejeito_aplicado_pct: rejeito_pct * 100,
    
    frete_confinamento_total,
    frete_confinamento_por_boi: frete_confinamento_total / qtd_animais,
    
    sanitario_mortalidade_total,
    sanitario_mortalidade_por_boi: sanitario_mortalidade_total / qtd_animais,
    sanitario_pct: sanitario_pct * 100,
    mortalidade_pct: mortalidade_pct * 100,
    
    ctr_total,
    ctr_por_boi: ctr_total / qtd_animais,
    
    cf_total,
    cf_por_boi: cf_total / qtd_animais,
    
    corp_total,
    corp_por_boi: corp_total / qtd_animais,
    
    depr_total,
    depr_por_boi: depr_total / qtd_animais,
    
    fin_total,
    fin_por_boi: fin_total / qtd_animais,
    
    outros_total,
    outros_por_boi: outros_total / qtd_animais,
    
    custo_total,
    custo_total_por_boi: custo_total / qtd_animais,
    resultado_jbs,
    resultado_jbs_por_boi: resultado_jbs / qtd_animais,
    resultado_por_arroba,
  };
  
  return { pecuarista, boitel };
}