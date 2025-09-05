import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HistoricalHint } from '@/components/HistoricalHint';
import type { SimulationFormType } from '@/schemas/simulationSchema';
import type { MatrixSuggestions } from '@/services/unitMatrix';

interface ZootecnicosBlockProps {
  data: SimulationFormType;
  onChange: (data: SimulationFormType) => void;
  matrixSuggestions?: MatrixSuggestions | null;
  historicalHints?: {[key: string]: { unit_median?: number; originator_median?: number }};
}

export function ZootecnicosBlock({ 
  data, 
  onChange, 
  matrixSuggestions,
  historicalHints = {}
}: ZootecnicosBlockProps) {
  const [dmiMode, setDmiMode] = useState<'pct_pv' | 'kg_dia'>('pct_pv');

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

  const applySuggestion = (field: keyof SimulationFormType, value: number) => {
    if (field === 'rc_pct') {
      handlePercentageChange(field, value);
    } else {
      handleFieldChange(field, value);
    }
  };

  // Calculate average weight for DMI calculation
  const calculateAverageWeight = () => {
    const entryWeight = data.peso_fazenda_kg || data.peso_entrada_balancao_kg || data.peso_entrada_balancinha_kg || 0;
    const exitWeight = entryWeight + ((data.gmd_kg_dia || 0) * (data.dias_cocho || 0));
    return (entryWeight + exitWeight) / 2;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Zootécnicos</CardTitle>
        <CardDescription>
          Parâmetros de desempenho animal. Use as sugestões da matriz ou valores históricos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dias_cocho">Dias no Cocho</Label>
            <div className="flex gap-2">
              <Input
                id="dias_cocho"
                type="number"
                value={data.dias_cocho || ''}
                onChange={(e) => handleFieldChange('dias_cocho', Number(e.target.value))}
              />
              {matrixSuggestions?.dias_cocho && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion('dias_cocho', matrixSuggestions.dias_cocho!)}
                  className="px-3 text-xs"
                >
                  {matrixSuggestions.dias_cocho}
                </Button>
              )}
            </div>
            <HistoricalHint 
              fieldName="dias_cocho" 
              hints={historicalHints.dias_cocho || {}}
              formatter={(v) => `${v} dias`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gmd_kg_dia">GMD (kg/dia)</Label>
            <div className="flex gap-2">
              <Input
                id="gmd_kg_dia"
                type="number"
                step="0.1"
                value={data.gmd_kg_dia || ''}
                onChange={(e) => handleFieldChange('gmd_kg_dia', Number(e.target.value))}
              />
              {matrixSuggestions?.gmd_kg_dia && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion('gmd_kg_dia', matrixSuggestions.gmd_kg_dia!)}
                  className="px-3 text-xs"
                >
                  {matrixSuggestions.gmd_kg_dia}
                </Button>
              )}
            </div>
            <HistoricalHint 
              fieldName="gmd_kg_dia" 
              hints={historicalHints.gmd_kg_dia || {}}
              formatter={(v) => `${v} kg/d`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rc_pct">RC (%)</Label>
            <div className="flex gap-2">
              <Input
                id="rc_pct"
                type="number"
                step="0.1"
                value={getPercentageValue('rc_pct')}
                onChange={(e) => handlePercentageChange('rc_pct', Number(e.target.value))}
              />
              {matrixSuggestions?.pct_rc && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion('rc_pct', matrixSuggestions.pct_rc!)}
                  className="px-3 text-xs"
                >
                  {matrixSuggestions.pct_rc}%
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* DMI Mode Selection */}
        <div className="space-y-3">
          <Label>Modo DMI</Label>
          <RadioGroup
            value={dmiMode}
            onValueChange={(value: 'pct_pv' | 'kg_dia') => setDmiMode(value)}
            className="flex flex-row gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pct_pv" id="dmi_pct_pv" />
              <Label htmlFor="dmi_pct_pv">% do Peso Vivo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="kg_dia" id="dmi_kg_dia" />
              <Label htmlFor="dmi_kg_dia">kg/dia direto</Label>
            </div>
          </RadioGroup>
        </div>

        {/* DMI Input based on mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dmiMode === 'pct_pv' ? (
            <div className="space-y-2">
              <Label htmlFor="pct_pv">% PV</Label>
              <div className="flex gap-2">
                <Input
                  id="pct_pv"
                  type="number"
                  step="0.1"
                  value={data.pct_pv ? (data.pct_pv * 100) : 2.5}
                  onChange={(e) => handleFieldChange('pct_pv', Number(e.target.value) / 100)}
                />
                {matrixSuggestions?.pct_pv && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFieldChange('pct_pv', matrixSuggestions.pct_pv! / 100)}
                    className="px-3 text-xs"
                  >
                    {matrixSuggestions.pct_pv}%
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                DMI calculado: {(calculateAverageWeight() * ((data.pct_pv || 0.025) * 100) / 100).toFixed(2)} kg/dia
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="dmi_kg_dia">DMI (kg/dia)</Label>
              <div className="flex gap-2">
                <Input
                  id="dmi_kg_dia"
                  type="number"
                  step="0.1"
                  value={data.dmi_kg_dia || ''}
                  onChange={(e) => handleFieldChange('dmi_kg_dia', Number(e.target.value))}
                />
                {matrixSuggestions?.consumo_ms_kg_dia && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applySuggestion('dmi_kg_dia', matrixSuggestions.consumo_ms_kg_dia!)}
                    className="px-3 text-xs"
                  >
                    {matrixSuggestions.consumo_ms_kg_dia}
                  </Button>
                )}
              </div>
              <HistoricalHint 
                fieldName="dmi_kg_dia" 
                hints={historicalHints.dmi_kg_dia || {}}
                formatter={(v) => `${v} kg/d`}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custo_ms_kg">Custo MS (R$/kg)</Label>
            <div className="flex gap-2">
              <Input
                id="custo_ms_kg"
                type="number"
                step="0.01"
                value={data.custo_ms_kg || ''}
                onChange={(e) => handleFieldChange('custo_ms_kg', Number(e.target.value))}
              />
              {matrixSuggestions?.custo_ms_dia_racao_kg && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion('custo_ms_kg', matrixSuggestions.custo_ms_dia_racao_kg!)}
                  className="px-3 text-xs"
                >
                  R$ {matrixSuggestions.custo_ms_dia_racao_kg}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Waste Percentage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="desperdicio_ms_pct">Desperdício MS (%)</Label>
            <Input
              id="desperdicio_ms_pct"
              type="number"
              step="0.1"
              value={data.desperdicio_ms_pct ? (data.desperdicio_ms_pct * 100) : 5}
              onChange={(e) => handleFieldChange('desperdicio_ms_pct', Number(e.target.value) / 100)}
              placeholder="5.0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}