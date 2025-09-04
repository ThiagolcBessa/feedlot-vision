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
    console.log('Looking up matrix row for:', params);
    
    // Use raw SQL since unit_price_matrix is not in typed schema
    const query = `
      SELECT *
      FROM unit_price_matrix
      WHERE unit_code = '${params.unit_code}'
        AND modalidade = '${params.modalidade}'
        AND dieta = '${params.dieta}'
        AND tipo_animal = '${params.tipo_animal}'
        AND is_active = true
        AND (peso_de_kg IS NULL OR peso_de_kg <= ${params.entry_weight_kg})
        AND (peso_ate_kg IS NULL OR peso_ate_kg >= ${params.entry_weight_kg})
      ORDER BY peso_de_kg ASC NULLS FIRST, peso_ate_kg ASC NULLS LAST
      LIMIT 1
    `;

    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.error('Error querying unit_price_matrix:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('No matching matrix row found for params:', params);
      return null;
    }

    const row = data[0];

    // Map the database row to suggestions format
    const suggestions: MatrixSuggestions = {
      dias_cocho: row.dias_cocho,
      gmd_kg_dia: row.gmd_kg_dia,
      pct_pv: row.pct_pv,
      consumo_ms_kg_dia: row.consumo_ms_kg_dia,
      pct_rc: row.pct_rc,
      custo_ms_total: row.custo_ms_total,
      service_price: params.modalidade === 'Arroba Prod.' 
        ? row.tabela_final_r_por_arroba 
        : row.diaria_r_por_cab_dia,
      service_price_base: params.modalidade === 'Arroba Prod.'
        ? row.tabela_base_r_por_arroba 
        : row.diaria_r_por_cab_dia,
      concat_label: row.concat_label,
      matched_row: row as UnitMatrixRow,
    };
    
    return suggestions;
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
    const { data, error } = await supabase
      .from('units')
      .select('code, name, state')
      .order('code');

    if (error) {
      console.error('Error fetching units:', error);
      return [];
    }

    return data || [];
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
    const query = `
      SELECT DISTINCT dieta
      FROM unit_price_matrix
      WHERE unit_code = '${unit_code}' AND is_active = true
      ORDER BY dieta
    `;

    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.error('Error fetching dietas:', error);
      return [];
    }

    return data?.map((row: any) => row.dieta).filter(Boolean) || [];
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
    const query = `
      SELECT DISTINCT tipo_animal
      FROM unit_price_matrix
      WHERE unit_code = '${unit_code}' 
        AND dieta = '${dieta}'
        AND is_active = true
      ORDER BY tipo_animal
    `;

    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.error('Error fetching animal types:', error);
      return [];
    }

    return data?.map((row: any) => row.tipo_animal).filter(Boolean) || [];
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
    const query = `
      SELECT DISTINCT modalidade
      FROM unit_price_matrix
      WHERE unit_code = '${unit_code}' 
        AND dieta = '${dieta}'
        AND tipo_animal = '${tipo_animal}'
        AND is_active = true
      ORDER BY modalidade
    `;

    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.error('Error fetching modalidades:', error);
      return [];
    }

    return data?.map((row: any) => row.modalidade).filter(Boolean) || [];
  } catch (error) {
    console.error('Error in fetchModalidadesForSelection:', error);
    return [];
  }
}