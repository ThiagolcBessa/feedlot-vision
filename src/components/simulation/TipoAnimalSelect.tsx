import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useMatrixAnimalTypes } from '@/hooks/useMatrixAnimalTypes';
import { PremissasLink } from '@/components/PremissasLink';
import type { SimulationFormType } from '@/schemas/simulationSchema';

interface TipoAnimalSelectProps {
  data: SimulationFormType;
  onChange: (field: keyof SimulationFormType, value: any) => void;
}

export function TipoAnimalSelect({ data, onChange }: TipoAnimalSelectProps) {
  const [showHistorical, setShowHistorical] = useState(false);
  
  // Hook to fetch animal types with optional historical mode
  const { animalTypes, loading, error } = useMatrixAnimalTypes({
    unitCode: data.unit_code,
    dieta: data.dieta,
    modalidade: data.modalidade,
    dateRef: data.date_ref,
    includeHistorical: showHistorical
  });

  // Reset showHistorical when dependencies change
  useEffect(() => {
    if (data.tipo_animal) {
      onChange('tipo_animal', undefined);
    }
    setShowHistorical(false);
  }, [data.unit_code, data.dieta, data.modalidade, data.date_ref]);

  const hasRequiredFields = Boolean(data.unit_code && data.dieta && data.modalidade && data.date_ref);
  const hasNoValidTypes = hasRequiredFields && animalTypes.length === 0 && !showHistorical && !loading;

  return (
    <div className="space-y-2">
      <Label htmlFor="tipo_animal">Tipo Animal</Label>
      
      {/* Main Select */}
      <div className="space-y-2">
        <Select 
          value={data.tipo_animal || ''} 
          onValueChange={(value) => onChange('tipo_animal', value)}
          disabled={!hasRequiredFields || loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !hasRequiredFields 
                ? "Selecione unidade/dieta/modalidade/data" 
                : loading
                ? "Carregando..."
                : animalTypes.length === 0
                ? "Nenhum tipo disponível"
                : "Selecione o tipo"
            } />
          </SelectTrigger>
          <SelectContent>
            {animalTypes.map(tipo => (
              <SelectItem key={tipo} value={tipo}>
                {tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Historical badge */}
        {showHistorical && animalTypes.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            Histórico (sem vigência)
          </Badge>
        )}
      </div>

      {/* Warning when no valid types found */}
      {hasNoValidTypes && (
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Não há tipos vigentes nessa data para esta combinação.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-2">
            <PremissasLink 
              unit_code={data.unit_code}
              modalidade={data.modalidade}
              dieta={data.dieta}
              className="w-full"
            />
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-historical"
                checked={showHistorical}
                onCheckedChange={setShowHistorical}
              />
              <Label htmlFor="show-historical" className="text-sm">
                Listar tipos históricos
              </Label>
            </div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar tipos: {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}