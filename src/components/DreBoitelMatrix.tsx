import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/services/calculations';
import type { DREBoitelData } from '@/services/matrixCalculator';

interface DreBoitelMatrixProps {
  data: DREBoitelData;
  qtdAnimais: number;
}

export function DreBoitelMatrix({ data, qtdAnimais }: DreBoitelMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-blue-700 dark:text-blue-400">
          DRE JBS/Boitel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 font-semibold text-sm border-b pb-2">
            <div>Item</div>
            <div className="text-center">Unitário/Boi</div>
            <div className="text-center">Lote ({qtdAnimais} cab)</div>
          </div>
          
          {/* RECEITA */}
          <div className="space-y-2">
            <div className="font-medium text-green-700">RECEITA</div>
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Preço de Serviço</div>
              <div className="text-center">{formatCurrency(data.receita_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.receita_service)}</div>
            </div>
          </div>
          
          {/* CUSTOS */}
          <div className="space-y-2">
            <div className="font-medium text-red-700">CUSTOS</div>
            
            {/* Alimentar */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Alimentar</div>
              <div className="text-center">{formatCurrency(data.custo_alimentar_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.custo_alimentar_total)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pl-8">
              <div>DMI {data.dmi_kg_dia.toFixed(1)}kg × {data.dias_cocho}d × R${data.custo_ms_kg.toFixed(2)}/kg × (1+{data.rejeito_aplicado_pct.toFixed(1)}%)</div>
              <div></div>
              <div></div>
            </div>
            
            {/* Frete Confinamento */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Frete Confinamento</div>
              <div className="text-center">{formatCurrency(data.frete_confinamento_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.frete_confinamento_total)}</div>
            </div>
            
            {/* Sanitário + Mortalidade */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Sanitário + Mortalidade</div>
              <div className="text-center">{formatCurrency(data.sanitario_mortalidade_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.sanitario_mortalidade_total)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pl-8">
              <div>Sanitário {data.sanitario_pct.toFixed(1)}% + Mortalidade {data.mortalidade_pct.toFixed(1)}%</div>
              <div></div>
              <div></div>
            </div>
            
            {/* CTR */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>CTR</div>
              <div className="text-center">{formatCurrency(data.ctr_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.ctr_total)}</div>
            </div>
            
            {/* CF */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Custo Fixo (CF)</div>
              <div className="text-center">{formatCurrency(data.cf_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.cf_total)}</div>
            </div>
            
            {/* Corp */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Corporativo (Corp)</div>
              <div className="text-center">{formatCurrency(data.corp_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.corp_total)}</div>
            </div>
            
            {/* Depreciação */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Depreciação</div>
              <div className="text-center">{formatCurrency(data.depr_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.depr_total)}</div>
            </div>
            
            {/* Financeiro */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Financeiro</div>
              <div className="text-center">{formatCurrency(data.fin_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.fin_total)}</div>
            </div>
            
            {/* Outros */}
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Outros</div>
              <div className="text-center">{formatCurrency(data.outros_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.outros_total)}</div>
            </div>
            
            {/* Total Custos */}
            <div className="border-t pt-2 mt-2">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium pl-4">
                <div>TOTAL CUSTOS</div>
                <div className="text-center">{formatCurrency(data.custo_total_por_boi)}</div>
                <div className="text-center">{formatCurrency(data.custo_total)}</div>
              </div>
            </div>
          </div>
          
          {/* RESULTADO */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="font-bold text-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>RESULTADO JBS</div>
                  <div className={`text-center ${data.resultado_jbs_por_boi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.resultado_jbs_por_boi)}
                  </div>
                  <div className={`text-center ${data.resultado_jbs >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.resultado_jbs)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* INDICADORES */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 mt-4">
            <div className="font-medium text-sm">INDICADORES</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Resultado por @:</span>
                <div className="font-medium">{formatCurrency(data.resultado_por_arroba)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}