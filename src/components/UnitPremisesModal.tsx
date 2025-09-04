import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { UnitMatrixRow } from '@/services/unitMatrix';
import { formatCurrency, formatWeight, formatPercentage } from '@/services/calculations';

interface UnitPremisesModalProps {
  open: boolean;
  onClose: () => void;
  matrixRow: UnitMatrixRow | null;
  onApplySuggestion: (field: string, value: number) => void;
}

export function UnitPremisesModal({ open, onClose, matrixRow, onApplySuggestion }: UnitPremisesModalProps) {
  if (!matrixRow) return null;

  const suggestions = [
    {
      field: 'days_on_feed',
      label: 'Dias no Cocho',
      value: matrixRow.dias_cocho,
      formatter: (v: number) => `${v} dias`,
    },
    {
      field: 'adg_kg_day',
      label: 'GMD',
      value: matrixRow.gmd_kg_dia,
      formatter: (v: number) => `${v} kg/dia`,
    },
    {
      field: 'dmi_pct_bw',
      label: '% PV (DMI)',
      value: matrixRow.pct_pv,
      formatter: (v: number) => formatPercentage(v / 100),
    },
    {
      field: 'dmi_kg_day',
      label: 'Consumo MS',
      value: matrixRow.consumo_ms_kg_dia,
      formatter: (v: number) => `${v} kg/dia`,
    },
    {
      field: 'carcass_yield_pct',
      label: 'RC (%)',
      value: matrixRow.pct_rc,
      formatter: (v: number) => formatPercentage(v / 100),
    },
    {
      field: 'feed_cost_kg_dm',
      label: 'Custo MS Total',
      value: matrixRow.custo_ms_total,
      formatter: (v: number) => formatCurrency(v),
    },
  ].filter(s => s.value !== null && s.value !== undefined);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Premissas da Unidade</DialogTitle>
          <DialogDescription>
            Valores sugeridos baseados na matriz de preços para: {matrixRow.concat_label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Etiqueta:</span>
                <Badge variant="secondary" className="font-mono">
                  {matrixRow.concat_label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Modalidade:</span>
                <Badge variant="outline">{matrixRow.modalidade}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Faixa:</span>
                <span className="text-sm font-medium">{matrixRow.faixa_label || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Peso (De/Até):</span>
                <span className="text-sm font-medium">
                  {matrixRow.peso_de_kg ? formatWeight(matrixRow.peso_de_kg) : 'N/A'} - {matrixRow.peso_ate_kg ? formatWeight(matrixRow.peso_ate_kg) : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Preços de Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {matrixRow.modalidade === 'Arroba Prod.' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Base:</span>
                    <span className="text-sm font-medium">
                      {matrixRow.tabela_base_r_por_arroba ? formatCurrency(matrixRow.tabela_base_r_por_arroba) + ' /@ ' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Final:</span>
                    <span className="text-sm font-semibold text-primary">
                      {matrixRow.tabela_final_r_por_arroba ? formatCurrency(matrixRow.tabela_final_r_por_arroba) + ' /@' : 'N/A'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Diária:</span>
                  <span className="text-sm font-semibold text-primary">
                    {matrixRow.diaria_r_por_cab_dia ? formatCurrency(matrixRow.diaria_r_por_cab_dia) + ' /cab/dia' : 'N/A'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Sugestões de Parâmetros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.field} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{suggestion.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {suggestion.formatter(suggestion.value!)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApplySuggestion(suggestion.field, suggestion.value!)}
                      className="ml-2"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}