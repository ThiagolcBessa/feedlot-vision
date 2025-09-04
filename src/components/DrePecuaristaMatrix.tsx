import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/services/calculations';
import type { DREPecuaristaData } from '@/services/matrixCalculator';

interface DrePecuaristaMatrixProps {
  data: DREPecuaristaData;
  qtdAnimais: number;
}

export function DrePecuaristaMatrix({ data, qtdAnimais }: DrePecuaristaMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-700 dark:text-green-400">
          DRE Pecuarista
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
              <div>@ Gancho × Preço @ Gordo</div>
              <div className="text-center">{formatCurrency(data.receita_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.receita_total)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pl-8">
              <div>{data.arrobas_gancho.toFixed(1)} @ × {formatCurrency(data.preco_boi_gordo)}</div>
              <div></div>
              <div></div>
            </div>
          </div>
          
          {/* BOI MAGRO */}
          <div className="space-y-2">
            <div className="font-medium text-red-700">BOI MAGRO</div>
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>@ Magro × Preço @ Magro ± Ágio</div>
              <div className="text-center">{formatCurrency(data.boi_magro_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.boi_magro_total)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground pl-8">
              <div>{data.arrobas_magro.toFixed(1)} @ × {formatCurrency(data.preco_boi_magro)} + {formatCurrency(data.agio_magro)}</div>
              <div></div>
              <div></div>
            </div>
          </div>
          
          {/* ENGORDA */}
          <div className="space-y-2">
            <div className="font-medium text-blue-700">ENGORDA (SERVIÇO)</div>
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Preço de Serviço</div>
              <div className="text-center">{formatCurrency(data.engorda_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.engorda_service)}</div>
            </div>
          </div>
          
          {/* TAXAS E FRETES */}
          <div className="space-y-2">
            <div className="font-medium text-orange-700">TAXAS E FRETES</div>
            <div className="grid grid-cols-3 gap-4 text-sm pl-4">
              <div>Taxa Abate + Frete Pecuarista + ICMS</div>
              <div className="text-center">{formatCurrency(data.taxas_frete_por_boi)}</div>
              <div className="text-center">{formatCurrency(data.taxas_frete_total)}</div>
            </div>
            <div className="space-y-1 pl-8 text-xs text-muted-foreground">
              <div className="grid grid-cols-3 gap-4">
                <div>Taxa Abate: {formatCurrency(data.taxa_abate)}</div>
                <div></div>
                <div></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>Frete Pecuarista: {formatCurrency(data.frete_pecuarista)}</div>
                <div></div>
                <div></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>ICMS Devolução: {formatCurrency(data.icms_devolucao)}</div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>
          
          {/* RESULTADO */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="font-bold text-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>RESULTADO PECUARISTA</div>
                  <div className={`text-center ${data.resultado_por_boi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.resultado_por_boi)}
                  </div>
                  <div className={`text-center ${data.resultado_total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.resultado_total)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* INDICADORES */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 mt-4">
            <div className="font-medium text-sm">INDICADORES</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Custo @ Produzida:</span>
                <div className="font-medium">{formatCurrency(data.custo_arroba_produzida)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Resultado/@ BM:</span>
                <div className="font-medium">{formatCurrency(data.resultado_por_arroba_magro)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Retorno Mensal:</span>
                <div className="font-medium">{formatPercentage(data.retorno_mensal_pct)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}