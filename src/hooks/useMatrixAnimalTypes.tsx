import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseMatrixAnimalTypesParams {
  unitCode?: string;
  dieta?: string;
  modalidade?: string;
  dateRef?: Date;
}

export function useMatrixAnimalTypes({ unitCode, dieta, modalidade, dateRef }: UseMatrixAnimalTypesParams) {
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnimalTypes = async () => {
      // Reset state
      setAnimalTypes([]);
      setError(null);

      // Check if all required params are present
      if (!unitCode || !dieta || !modalidade || !dateRef) {
        return;
      }

      setLoading(true);
      
      try {
        const dateISO = dateRef.toISOString().slice(0, 10);
        
        const { data, error: queryError } = await supabase
          .from('unit_price_matrix')
          .select('tipo_animal')
          .eq('unit_code', unitCode)
          .eq('dieta', dieta)
          .eq('modalidade', modalidade)
          .lte('start_validity', dateISO)
          .or(`end_validity.is.null,end_validity.gt.${dateISO}`)
          .not('tipo_animal', 'is', null)
          .order('tipo_animal', { ascending: true });

        if (queryError) {
          throw queryError;
        }

        // Get unique animal types
        const uniqueTypes = Array.from(new Set((data ?? []).map(r => r.tipo_animal).filter(Boolean)));
        console.debug('[animals]', { unitCode, dieta, modalidade, dateISO, count: uniqueTypes.length });
        setAnimalTypes(uniqueTypes);
      } catch (err) {
        console.error('Error fetching animal types:', err);
        setError(err instanceof Error ? err.message : 'Error fetching animal types');
      } finally {
        setLoading(false);
      }
    };

    fetchAnimalTypes();
  }, [unitCode, dieta, modalidade, dateRef]);

  const isReady = Boolean(unitCode && dieta && modalidade && dateRef);

  return {
    animalTypes,
    loading,
    error,
    isReady
  };
}