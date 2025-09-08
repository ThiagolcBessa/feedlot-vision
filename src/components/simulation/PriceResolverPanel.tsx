import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/services/calculations';
import type { SimulationFormType } from '@/schemas/simulationSchema';

interface PriceResolverPanelProps {
  formData: SimulationFormType;
  onPriceResolved: (data: any) => void;
}

interface MatrixRow {
  id: string;
  concat_label: string;
  tabela_final_r_por_arroba?: number;
  diaria_r_por_cab_dia?: number;
  dias_cocho?: number;
  gmd_kg_dia?: number;
  pct_pv?: number;
  consumo_ms_kg_dia?: number;
  pct_rc?: number;
  custo_ms_total?: number;
}

export function PriceResolverPanel({ formData, onPriceResolved }: PriceResolverPanelProps) {
  const [matrixRow, setMatrixRow] = useState<MatrixRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const shouldResolve = 
      formData.unit_code &&
      formData.modalidade &&
      formData.dieta &&
      formData.tipo_animal &&
      formData.peso_entrada_balancao_kg &&
      formData.date_ref;

    if (shouldResolve) {
      resolvePrice();
    } else {
      setMatrixRow(null);
      setError(null);
    }
  }, [
    formData.unit_code,
    formData.modalidade,
    formData.dieta,
    formData.tipo_animal,
    formData.peso_entrada_balancao_kg,
    formData.date_ref
  ]);

  const resolvePrice = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateISO = new Date(formData.date_ref!).toISOString().split('T')[0];
      
      console.debug('[resolver]', { 
        unitCode: formData.unit_code,
        dieta: formData.dieta,
        modalidade: formData.modalidade,
        tipo: formData.tipo_animal,
        pesoBalancao: formData.peso_entrada_balancao_kg,
        dateISO
      });

      const { data, error: queryError } = await supabase
        .from('unit_price_matrix')
        .select('*')
        .eq('unit_code', formData.unit_code)
        .eq('modalidade', formData.modalidade)
        .eq('dieta', formData.dieta)
        .eq('tipo_animal', formData.tipo_animal)
        .lte('start_validity', dateISO)
        .or(`end_validity.is.null,end_validity.gt.${dateISO}`)
        .lte('peso_de_kg', formData.peso_entrada_balancao_kg!)
        .or(`peso_ate_kg.is.null,peso_ate_kg.gt.${formData.peso_entrada_balancao_kg}`)
        .eq('is_active', true);

      if (queryError) throw queryError;

      console.debug(`Price resolver found ${data?.length || 0} rows`);

      if (!data || data.length === 0) {
        setError('Não há preço para esta combinação (peso/data). Ajuste filtros ou cadastre em Premissas.');
        setMatrixRow(null);
        return;
      }

      if (data.length > 1) {
        console.warn('Multiple matrix rows found, using first one:', data);
      }

      const row = data[0];
      console.debug('Matched matrix row ID:', row.id);
      
      setMatrixRow(row);
      onPriceResolved(row);

    } catch (err) {
      console.error('Error resolving price:', err);
      setError('Erro ao consultar matriz de preços');
      setMatrixRow(null);
    } finally {
      setLoading(false);
    }
  };

  const openPremissas = () => {
    const params = new URLSearchParams({
      unit_code: formData.unit_code || '',
      modalidade: formData.modalidade || '',
      dieta: formData.dieta || '',
      tipo_animal: formData.tipo_animal || '',
    });
    
    if (matrixRow?.id) {
      params.set('highlight', matrixRow.id);
    }
    
    window.open(`/premissas?${params.toString()}`, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preço & Etiqueta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Consultando matriz...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Preço & Etiqueta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openPremissas}
            className="w-full mt-3"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Abrir Premissas
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!matrixRow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preço & Etiqueta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Complete os dados para visualizar preços
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Preço & Etiqueta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Etiqueta */}
        <div>
          <Badge variant="secondary" className="text-xs">
            {matrixRow.concat_label}
          </Badge>
        </div>

        {/* Service Price */}
        <div className="space-y-1">
          <p className="text-xs font-medium">Serviço:</p>
          {formData.modalidade === 'Arroba Prod.' && matrixRow.tabela_final_r_por_arroba && (
            <p className="text-sm">{formatCurrency(matrixRow.tabela_final_r_por_arroba)}/@</p>
          )}
          {formData.modalidade === 'Diária' && matrixRow.diaria_r_por_cab_dia && (
            <p className="text-sm">{formatCurrency(matrixRow.diaria_r_por_cab_dia)}/cab/dia</p>
          )}
        </div>

        {/* Suggestions */}
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Sugestões da Matriz:</p>
          <div className="space-y-1 text-xs">
            {matrixRow.dias_cocho && (
              <div className="flex justify-between">
                <span>Dias Cocho:</span>
                <span className="font-medium">{matrixRow.dias_cocho}</span>
              </div>
            )}
            {matrixRow.gmd_kg_dia && (
              <div className="flex justify-between">
                <span>GMD:</span>
                <span className="font-medium">{matrixRow.gmd_kg_dia} kg/d</span>
              </div>
            )}
            {matrixRow.pct_rc && (
              <div className="flex justify-between">
                <span>RC:</span>
                <span className="font-medium">{matrixRow.pct_rc}%</span>
              </div>
            )}
            {matrixRow.consumo_ms_kg_dia && (
              <div className="flex justify-between">
                <span>DMI:</span>
                <span className="font-medium">{matrixRow.consumo_ms_kg_dia} kg/d</span>
              </div>
            )}
            {matrixRow.custo_ms_total && (
              <div className="flex justify-between">
                <span>Custo MS:</span>
                <span className="font-medium">{formatCurrency(matrixRow.custo_ms_total)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={openPremissas}
          className="w-full"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Ver Premissas
        </Button>
      </CardContent>
    </Card>
  );
}