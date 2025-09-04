import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches distinct animal types from the unit price matrix
 */
export async function fetchAnimalTypes() {
  try {
    const { data, error } = await supabase
      .from('unit_price_matrix' as any)
      .select('tipo_animal');
    
    if (error) throw error;
    
    const uniqueTypes = [...new Set((data as any[]).map(item => item.tipo_animal))]
      .filter(Boolean)
      .sort();
    
    return uniqueTypes;
  } catch (error) {
    console.error('Error fetching animal types:', error);
    return [];
  }
}

/**
 * Fetches distinct modalidades from the unit price matrix
 */
export async function fetchModalidades() {
  try {
    const { data, error } = await supabase
      .from('unit_price_matrix' as any)
      .select('modalidade');
    
    if (error) throw error;
    
    const uniqueModalidades = [...new Set((data as any[]).map(item => item.modalidade))]
      .filter(Boolean)
      .sort();
    
    return uniqueModalidades;
  } catch (error) {
    console.error('Error fetching modalidades:', error);
    return [];
  }
}

/**
 * Fetches distinct dietas from the unit price matrix
 */
export async function fetchDietas() {
  try {
    const { data, error } = await supabase
      .from('unit_price_matrix' as any)
      .select('dieta');
    
    if (error) throw error;
    
    const uniqueDietas = [...new Set((data as any[]).map(item => item.dieta))]
      .filter(Boolean)
      .sort();
    
    return uniqueDietas;
  } catch (error) {
    console.error('Error fetching dietas:', error);
    return [];
  }
}

/**
 * Fetches units from the units table
 */
export async function fetchUnits() {
  try {
    const { data, error } = await supabase
      .from('units' as any)
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching units:', error);
      // Return fallback mock data with proper structure
      return [
        { code: 'CGA', name: 'CGA Unit', state: 'GO' },
        { code: 'CBS', name: 'CBS Unit', state: 'MS' },
        { code: 'CCF', name: 'CCF Unit', state: 'MT' },
        { code: 'CLV', name: 'CLV Unit', state: 'GO' },
        { code: 'CPN', name: 'CPN Unit', state: 'MT' },
      ];
    }
    
    // Transform data to expected format
    return (data || []).map((unit: any) => ({
      code: unit.code,
      name: unit.name || unit.code,
      state: unit.state || 'N/A'
    }));
  } catch (error) {
    console.error('Error fetching units:', error);
    // Return fallback mock data
    return [
      { code: 'CGA', name: 'CGA Unit', state: 'GO' },
      { code: 'CBS', name: 'CBS Unit', state: 'MS' },
      { code: 'CCF', name: 'CCF Unit', state: 'MT' },
      { code: 'CLV', name: 'CLV Unit', state: 'GO' },
      { code: 'CPN', name: 'CPN Unit', state: 'MT' },
    ];
  }
}