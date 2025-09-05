import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { SimulationFormType } from '@/schemas/simulationSchema';

interface QuebrasPesoBlockProps {
  data: SimulationFormType;
  onChange: (data: SimulationFormType) => void;
}

export function QuebrasPesoBlock({ data, onChange }: QuebrasPesoBlockProps) {
  const handleFieldChange = (field: keyof SimulationFormType, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handlePercentageChange = (field: keyof SimulationFormType, percentValue: number) => {
    handleFieldChange(field, percentValue / 100);
  };

  const getPercentageValue = (field: keyof SimulationFormType): number => {
    const value = data[field] as number;
    return value ? value * 100 : 0;
  };

  // Calculate projected weights based on scale type and quebras
  const calculateProjectedWeights = () => {
    const fazenda = data.peso_fazenda_kg || 0;
    const quebra_fazenda = data.quebra_fazenda_pct || 0;
    const quebra_balanca = data.quebra_balanca_pct || 0;
    
    const balancao = fazenda * (1 - quebra_fazenda);
    const balancinha = balancao * (1 - quebra_balanca);
    
    return { balancao, balancinha };
  };

  const { balancao: projectedBalancao, balancinha: projectedBalancinha } = calculateProjectedWeights();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Quebras de Peso</CardTitle>
        <CardDescription>
          Configure o tipo de balança e os pesos. O preço da matriz sempre usa o peso Balanção.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scale Type */}
        <div className="space-y-3">
          <Label>Tipo de Balança</Label>
          <RadioGroup
            value={data.scale_type || ''}
            onValueChange={(value) => handleFieldChange('scale_type', value)}
            className="flex flex-row gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Fazenda" id="fazenda" />
              <Label htmlFor="fazenda">Fazenda</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Balanção" id="balancao" />
              <Label htmlFor="balancao">Balanção</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Balancinha" id="balancinha" />
              <Label htmlFor="balancinha">Balancinha</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Quebras Percentages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quebra_fazenda_pct">Quebra Fazenda (%)</Label>
            <Input
              id="quebra_fazenda_pct"
              type="number"
              step="0.1"
              value={getPercentageValue('quebra_fazenda_pct')}
              onChange={(e) => handlePercentageChange('quebra_fazenda_pct', Number(e.target.value))}
              placeholder="2.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quebra_balanca_pct">Quebra Balança (%)</Label>
            <Input
              id="quebra_balanca_pct"
              type="number"
              step="0.1"
              value={getPercentageValue('quebra_balanca_pct')}
              onChange={(e) => handlePercentageChange('quebra_balanca_pct', Number(e.target.value))}
              placeholder="1.0"
            />
          </div>
        </div>

        {/* Weights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="peso_fazenda_kg">Peso Fazenda (kg)</Label>
            <Input
              id="peso_fazenda_kg"
              type="number"
              step="0.1"
              value={data.peso_fazenda_kg || ''}
              onChange={(e) => handleFieldChange('peso_fazenda_kg', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="peso_entrada_balancao_kg">
              Peso Entrada - Balanção (kg) 
              <span className="text-xs text-muted-foreground">*usado para preço</span>
            </Label>
            <Input
              id="peso_entrada_balancao_kg"
              type="number"
              step="0.1"
              value={data.peso_entrada_balancao_kg || ''}
              onChange={(e) => handleFieldChange('peso_entrada_balancao_kg', Number(e.target.value))}
            />
            {data.peso_fazenda_kg && !data.peso_entrada_balancao_kg && (
              <p className="text-xs text-muted-foreground">
                Sugestão: {projectedBalancao.toFixed(1)} kg
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="peso_entrada_balancinha_kg">Peso Entrada - Balancinha (kg)</Label>
            <Input
              id="peso_entrada_balancinha_kg"
              type="number"
              step="0.1"
              value={data.peso_entrada_balancinha_kg || ''}
              onChange={(e) => handleFieldChange('peso_entrada_balancinha_kg', Number(e.target.value))}
            />
            {projectedBalancao && !data.peso_entrada_balancinha_kg && (
              <p className="text-xs text-muted-foreground">
                Sugestão: {projectedBalancinha.toFixed(1)} kg
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}