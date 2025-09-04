import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TaxasFreteFormProps {
  frete_confinamento_r?: number;
  frete_pecuarista_r?: number;
  taxa_abate_r?: number;
  icms_devolucao_r?: number;
  onChange: (field: string, value: number) => void;
}

export function TaxasFreteForm({
  frete_confinamento_r = 0,
  frete_pecuarista_r = 0,
  taxa_abate_r = 0,
  icms_devolucao_r = 0,
  onChange
}: TaxasFreteFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-orange-700 dark:text-orange-400">Taxas & Fretes</CardTitle>
        <CardDescription>
          Valores editáveis pelo usuário para taxas e fretes específicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frete_confinamento">Frete Confinamento (R$)</Label>
            <Input
              id="frete_confinamento"
              type="number"
              step="0.01"
              value={frete_confinamento_r || ''}
              onChange={(e) => onChange('frete_confinamento_r', Number(e.target.value))}
              className="bg-orange-50 border-orange-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frete_pecuarista">Frete Pecuarista (R$)</Label>
            <Input
              id="frete_pecuarista"
              type="number"
              step="0.01"
              value={frete_pecuarista_r || ''}
              onChange={(e) => onChange('frete_pecuarista_r', Number(e.target.value))}
              className="bg-orange-50 border-orange-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxa_abate">Taxa Abate (R$)</Label>
            <Input
              id="taxa_abate"
              type="number"
              step="0.01"
              value={taxa_abate_r || ''}
              onChange={(e) => onChange('taxa_abate_r', Number(e.target.value))}
              className="bg-orange-50 border-orange-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icms_devolucao">ICMS Devolução (R$)</Label>
            <Input
              id="icms_devolucao"
              type="number"
              step="0.01"
              value={icms_devolucao_r || ''}
              onChange={(e) => onChange('icms_devolucao_r', Number(e.target.value))}
              className="bg-orange-50 border-orange-200"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}