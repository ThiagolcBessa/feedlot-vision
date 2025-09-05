import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/services/calculations';

interface FretesTaxasBlockProps {
  frete_confinamento_r: number;
  frete_pecuarista_r: number;
  taxa_abate_r: number;
  icms_devolucao_r: number;
  onChange: (field: string, value: number) => void;
}

export function FretesTaxasBlock({
  frete_confinamento_r,
  frete_pecuarista_r,
  taxa_abate_r,
  icms_devolucao_r,
  onChange
}: FretesTaxasBlockProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Fretes e Taxas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frete_confinamento_r">Frete Confinamento (R$/animal)</Label>
            <Input
              id="frete_confinamento_r"
              type="number"
              step="0.01"
              value={frete_confinamento_r || ''}
              onChange={(e) => onChange('frete_confinamento_r', Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frete_pecuarista_r">Frete Pecuarista (R$/animal)</Label>
            <Input
              id="frete_pecuarista_r"
              type="number"
              step="0.01"
              value={frete_pecuarista_r || ''}
              onChange={(e) => onChange('frete_pecuarista_r', Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxa_abate_r">Taxa Abate (R$/animal)</Label>
            <Input
              id="taxa_abate_r"
              type="number"
              step="0.01"
              value={taxa_abate_r || ''}
              onChange={(e) => onChange('taxa_abate_r', Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icms_devolucao_r">ICMS Devolução (R$/animal)</Label>
            <Input
              id="icms_devolucao_r"
              type="number"
              step="0.01"
              value={icms_devolucao_r || ''}
              onChange={(e) => onChange('icms_devolucao_r', Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}