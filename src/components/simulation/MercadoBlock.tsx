import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/services/calculations';
import type { SimulationFormType } from '@/schemas/simulationSchema';

interface MercadoBlockProps {
  data: SimulationFormType;
  onChange: (data: SimulationFormType) => void;
}

export function MercadoBlock({ data, onChange }: MercadoBlockProps) {
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

  // Calculate ágio magro automatically
  const calculateAgioMagro = () => {
    const precoMagro = data.preco_boi_magro_r_por_arroba || 0;
    const precoGordo = data.preco_boi_gordo_r_por_arroba || 0;
    return precoMagro - precoGordo;
  };

  React.useEffect(() => {
    const agioCalculated = calculateAgioMagro();
    if (agioCalculated !== data.agio_magro_r) {
      handleFieldChange('agio_magro_r', agioCalculated);
    }
  }, [data.preco_boi_magro_r_por_arroba, data.preco_boi_gordo_r_por_arroba]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Mercado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rendimento Slider */}
        <div className="space-y-3">
          <Label>
            Rendimento Boi Magro: {getPercentageValue('rendimento_boi_magro_prod_pct').toFixed(1)}%
          </Label>
          <Slider
            value={[getPercentageValue('rendimento_boi_magro_prod_pct')]}
            onValueChange={([value]) => handlePercentageChange('rendimento_boi_magro_prod_pct', value)}
            min={45}
            max={60}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>45%</span>
            <span>60%</span>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preco_boi_magro_r_por_arroba">Preço Boi Magro (R$/@)</Label>
            <Input
              id="preco_boi_magro_r_por_arroba"
              type="number"
              step="0.01"
              value={data.preco_boi_magro_r_por_arroba || ''}
              onChange={(e) => handleFieldChange('preco_boi_magro_r_por_arroba', Number(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preco_boi_gordo_r_por_arroba">Preço Boi Gordo (R$/@)</Label>
            <Input
              id="preco_boi_gordo_r_por_arroba"
              type="number"
              step="0.01"
              value={data.preco_boi_gordo_r_por_arroba || ''}
              onChange={(e) => handleFieldChange('preco_boi_gordo_r_por_arroba', Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agio_magro_r">Ágio Magro (R$)</Label>
            <Input
              id="agio_magro_r"
              type="number"
              step="0.01"
              value={data.agio_magro_r || ''}
              onChange={(e) => handleFieldChange('agio_magro_r', Number(e.target.value))}
              className="bg-muted"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Calculado automaticamente: Magro - Gordo
              {data.preco_boi_magro_r_por_arroba && data.preco_boi_gordo_r_por_arroba && (
                <> = {formatCurrency(calculateAgioMagro())}</>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}