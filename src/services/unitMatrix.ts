import { supabase } from '@/integrations/supabase/client';

export interface UnitMatrixRow {
  id: string;
  unit_code: string;
  modalidade: string;
  dieta: string;
  tipo_animal: string;
  peso_de_kg: number | null;
  peso_ate_kg: number | null;
  dias_cocho: number | null;
  gmd_kg_dia: number | null;
  pct_pv: number | null;
  consumo_ms_kg_dia: number | null;
  pct_rc: number | null;
  custo_ms_total: number | null;
  tabela_final_r_por_arroba: number | null;
  tabela_base_r_por_arroba: number | null;
  diaria_r_por_cab_dia: number | null;
  concat_label: string;
  faixa_label: string | null;
  is_active: boolean;
}

export interface MatrixLookupParams {
  unit_code: string;
  modalidade: 'Diária' | 'Arroba Prod.';
  dieta: string;
  tipo_animal: string;
  entry_weight_kg: number;
}

export interface MatrixSuggestions {
  dias_cocho?: number;
  gmd_kg_dia?: number;
  pct_pv?: number;
  consumo_ms_kg_dia?: number;
  pct_rc?: number;
  custo_ms_total?: number;
  service_price?: number;
  service_price_base?: number;
  concat_label?: string;
  matched_row?: UnitMatrixRow;
}

/**
 * Fetches pricing matrix row for given selection criteria
 * Uses weight range matching: peso_de_kg <= entry_weight <= peso_ate_kg
 * Orders by peso_de_kg asc nulls first, peso_ate_kg asc nulls last
 */
export async function findMatrixRow(params: MatrixLookupParams): Promise<MatrixSuggestions | null> {
  try {
    // Since unit_price_matrix is not in typed schema, use raw SQL
    console.log('Looking up matrix row for:', params);
    
    // For now, return mock data based on params to test integration
    // In production, this would use supabase--read-query tool
    const mockSuggestions: MatrixSuggestions = {
      dias_cocho: 105,
      gmd_kg_dia: 1.6,
      pct_pv: 2.4,
      consumo_ms_kg_dia: params.entry_weight_kg * 0.024,
      pct_rc: 55.5,
      custo_ms_total: 1335.61,
      service_price: params.modalidade === 'Arroba Prod.' ? 18.5 : 227.16,
      service_price_base: params.modalidade === 'Arroba Prod.' ? 17.2 : 210.0,
      concat_label: `${params.unit_code}${params.tipo_animal}45809${params.modalidade}`,
    };
    
    return mockSuggestions;
  } catch (error) {
    console.error('Error in findMatrixRow:', error);
    return null;
  }
}

/**
 * Fetches all active units
 */
export async function fetchUnits() {
  try {
    // Mock data since units table not in typed schema
    return [
      { code: 'CGA', name: 'CGA Unit', state: 'BR' },
      { code: 'CBS', name: 'CBS Unit', state: 'BR' },
      { code: 'CCF', name: 'CCF Unit', state: 'BR' },
      { code: 'CLV', name: 'CLV Unit', state: 'BR' },
      { code: 'CPN', name: 'CPN Unit', state: 'BR' },
    ];
  } catch (error) {
    console.error('Error in fetchUnits:', error);
    return [];
  }
}

/**
 * Fetches available dietas for a given unit
 */
export async function fetchDietasForUnit(unit_code: string) {
  try {
    // Mock data since table not in typed schema
    console.log('Fetching dietas for unit:', unit_code);
    return ['Volumoso', 'Grão'];
  } catch (error) {
    console.error('Error in fetchDietasForUnit:', error);
    return [];
  }
}

/**
 * Fetches available animal types for a given unit and diet
 */
export async function fetchAnimalTypesForSelection(unit_code: string, dieta: string) {
  try {
    // Mock data since table not in typed schema
    console.log('Fetching animal types for:', { unit_code, dieta });
    return ['Boi Nelore', 'Novilha', 'Vaca'];
  } catch (error) {
    console.error('Error in fetchAnimalTypesForSelection:', error);
    return [];
  }
}

/**
 * Fetches available modalidades for a given selection
 */
export async function fetchModalidadesForSelection(unit_code: string, dieta: string, tipo_animal: string) {
  try {
    // Mock data since table not in typed schema
    console.log('Fetching modalidades for:', { unit_code, dieta, tipo_animal });
    return ['Diária', 'Arroba Prod.'];
  } catch (error) {
    console.error('Error in fetchModalidadesForSelection:', error);
    return [];
  }
}