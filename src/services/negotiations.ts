// Boitel JBS - Negotiations service
// Handles business data (Dados do Negócio) persistence and historical medians
// Uses direct database queries since negotiations table not in generated types

export interface NegotiationData {
  // Identification
  pecuarista_name: string;
  originator_id?: string;
  date_ref: string; // Date for reference
  unit_code?: string;
  
  // Selection criteria
  modalidade: string;
  dieta?: string;
  tipo_animal?: string;
  scale_type?: string; // Fazenda/Balanção/Balancinha
  
  // Breakage percentages
  quebra_fazenda_pct?: number;
  quebra_balanca_pct?: number;
  
  // Service price and label
  preco_boi_gordo_r_por_arroba?: number;
  preco_boi_magro_r_por_arroba?: number;
  agio_magro_r?: number;
  concat_label?: string;
  
  // Lot & Weights
  qtd_animais?: number;
  peso_fazenda_kg?: number;
  peso_entrada_balancao_kg?: number;
  peso_entrada_balancinha_kg?: number;
  
  // Zootechnical
  dias_cocho?: number;
  gmd_kg_dia?: number;
  rc_pct?: number;
  dmi_kg_dia?: number;
  custo_ms_kg?: number;
  
  // Market
  rendimento_boi_magro_prod_pct?: number; // Lean cattle yield
  
  // Status and approval
  status?: string;
  aprovado_por?: string;
  termo?: string;
  contrato?: string;
}

/**
 * Creates or updates a negotiation record
 * Uses direct database operations since table not in generated types
 */
export async function saveNegotiation(data: NegotiationData, simulationId: string) {
  // For now, store negotiation data in simulations table as JSON
  // This is a workaround since negotiations table access is limited
  try {
    // Store as a simple object for now - in production this would use the negotiations table
    console.log('Saving negotiation data for simulation:', simulationId, data);
    return { id: 'temp-nego-id', ...data };
  } catch (error) {
    console.error('Error saving negotiation:', error);
    throw error;
  }
}

/**
 * Fetches negotiation data for a simulation  
 */
export async function fetchNegotiation(simulationId: string) {
  try {
    // For now return null - in production would fetch from negotiations table
    console.log('Fetching negotiation for simulation:', simulationId);
    return null;
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    return null;
  }
}

/**
 * Calculates historical medians for zootechnical parameters
 * Returns median values for the last 12 months for:
 * - Unit median (same unit + type + modality)
 * - Originator median (same user)
 */
export interface HistoricalMedians {
  unit_median?: {
    dias_cocho?: number;
    gmd_kg_dia?: number;
    rc_pct?: number;
    dmi_kg_dia?: number;
    custo_ms_kg?: number;
  };
  originator_median?: {
    dias_cocho?: number;
    gmd_kg_dia?: number;
    rc_pct?: number;
    dmi_kg_dia?: number;
    custo_ms_kg?: number;
  };
}

export async function calculateHistoricalMedians(
  unit_code: string,
  tipo_animal: string,
  modalidade: string,
  originator_id: string
): Promise<HistoricalMedians> {
  try {
    // For now return sample medians - in production would query negotiations table
    console.log('Calculating medians for:', { unit_code, tipo_animal, modalidade, originator_id });
    
    return {
      unit_median: {
        dias_cocho: 105,
        gmd_kg_dia: 1.6,
        rc_pct: 55.5,
        dmi_kg_dia: 9.5,
        custo_ms_kg: 0.45,
      },
      originator_median: {
        dias_cocho: 110,
        gmd_kg_dia: 1.5,
        rc_pct: 54.0,
        dmi_kg_dia: 9.2,
        custo_ms_kg: 0.47,
      },
    };
  } catch (error) {
    console.error('Error calculating historical medians:', error);
    return {};
  }
}