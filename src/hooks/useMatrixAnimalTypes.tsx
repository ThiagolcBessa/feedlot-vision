import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseMatrixAnimalTypesParams {
  unitCode?: string;
  dieta?: string;
  modalidade?: string;
  dateRef?: Date;
  includeHistorical?: boolean;
}

export function useMatrixAnimalTypes({ 
  unitCode, 
  dieta, 
  modalidade, 
  dateRef, 
  includeHistorical = false 
}: UseMatrixAnimalTypesParams) {
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnimalTypes = async () => {
      // Reset state
      setAnimalTypes([]);
      setError(null);

      // Check if all required params are present (except date if includeHistorical)
      if (!unitCode || !dieta || !modalidade) {
        return;
      }

      setLoading(true);
      
      try {
        // Normalize strings
        const dietaN = dieta?.trim() ?? '';
        const modalidadeN = modalidade?.trim() ?? '';
        const dateISO = dateRef ? dateRef.toISOString().slice(0, 10) : null;
        
        let query = supabase
          .from('unit_price_matrix')
          .select('tipo_animal')
          .eq('unit_code', unitCode)
          .eq('dieta', dietaN)
          .eq('modalidade', modalidadeN)
          .not('tipo_animal', 'is', null)
          .order('tipo_animal', { ascending: true });

        // Add date filters only if not including historical and date is available
        if (!includeHistorical && dateISO) {
          query = query
            .lte('start_validity', dateISO)
            .or(`end_validity.is.null,end_validity.gt.${dateISO}`);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        // Get unique animal types
        const uniqueTypes = Array.from(new Set((data ?? []).map(r => r.tipo_animal).filter(Boolean)));
        console.debug('[animals]', { 
          unitCode, 
          dietaN, 
          modalidadeN, 
          dateISO, 
          includeHistorical, 
          count: uniqueTypes.length,
          error: queryError?.message 
        });
        setAnimalTypes(uniqueTypes);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error fetching animal types';
        console.error('Error fetching animal types:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimalTypes();
  }, [unitCode, dieta, modalidade, dateRef, includeHistorical]);

  return {
    animalTypes,
    loading,
    error
  };
}