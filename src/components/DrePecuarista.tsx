import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/services/calculations';

interface DrePecuaristaProps {
  data: {
    // Quantities
    arroubas_hook: number;
    arroubas_magro: number;
    arroubas_gain: number;
    days_on_feed: number;
    qtd_animais: number;

    // Prices
    price_fat_r_per_at: number;
    price_lean_r_per_at: number;
    agio_r: number;
    service_price: number;
    modalidade: 'Diária' | 'Arroba Prod.';

    // Costs & Fees  
    taxa_abate?: number;
    frete_pecuarista?: number;
    icms_devolucao?: number;

    // Investment for return calculation
    investment_boi_magro: number;
  };
  className?: string;
}

export function DrePecuarista({ data, className }: DrePecuaristaProps) {
  // Revenue calculations
  const revenue_per_head = data.arroubas_hook * data.price_fat_r_per_at;
  const revenue_total = revenue_per_head * data.qtd_animais;

  // Cost calculations
  const lean_cost_per_head = (data.arroubas_magro * data.price_lean_r_per_at) + (data.agio_r || 0);
  const lean_cost_total = lean_cost_per_head * data.qtd_animais;

  const fattening_cost_per_head = data.modalidade === 'Arroba Prod.' 
    ? data.arroubas_gain * data.service_price
    : data.days_on_feed * data.service_price; // Daily service price
  const fattening_cost_total = fattening_cost_per_head * data.qtd_animais;

  const fees_freight_per_head = (data.taxa_abate || 0) + (data.frete_pecuarista || 0) + (data.icms_devolucao || 0);
  const fees_freight_total = fees_freight_per_head * data.qtd_animais;

  const total_cost_per_head = lean_cost_per_head + fattening_cost_per_head + fees_freight_per_head;
  const total_cost_total = total_cost_per_head * data.qtd_animais;

  const result_per_head = revenue_per_head - total_cost_per_head;
  const result_total = result_per_head * data.qtd_animais;

  // Additional metrics
  const cost_per_at_produced = data.arroubas_gain > 0 ? fattening_cost_per_head / data.arroubas_gain : 0;
  const result_per_at_bm = data.arroubas_magro > 0 ? result_per_head / data.arroubas_magro : 0;
  
  // Monthly return % = (Result / Investment) / (Days/30) * 100
  const monthly_return_pct = data.investment_boi_magro > 0 && data.days_on_feed > 0 
    ? (result_per_head / data.investment_boi_magro) / (data.days_on_feed / 30) * 100 
    : 0;

  const dre_lines = [
    {
      label: 'RECEITA',
      items: [
        {
          label: `Venda @ Gordo (${data.arroubas_hook.toFixed(2)}@ × ${formatCurrency(data.price_fat_r_per_at)})`,
          per_head: revenue_per_head,
          total: revenue_total,
          bold: false
        }
      ]
    },
    {
      label: 'CUSTOS E DESPESAS',
      items: [
        {
          label: `Boi Magro (${data.arroubas_magro.toFixed(2)}@ × ${formatCurrency(data.price_lean_r_per_at)}${(data.agio_r || 0) !== 0 ? ` ${(data.agio_r || 0) > 0 ? '+' : ''}${formatCurrency(data.agio_r || 0)}` : ''})`,
          per_head: lean_cost_per_head,
          total: lean_cost_total,
          bold: false
        },
        {
          label: `Engorda ${data.modalidade === 'Arroba Prod.' ? `(${data.arroubas_gain.toFixed(2)}@ × ${formatCurrency(data.service_price)})` : `(${data.days_on_feed}d × ${formatCurrency(data.service_price)}/d)`}`,
          per_head: fattening_cost_per_head,
          total: fattening_cost_total,
          bold: false
        },
        {
          label: 'Taxas + Frete + ICMS',
          per_head: fees_freight_per_head,
          total: fees_freight_total,
          bold: false
        }
      ]
    },
    {
      label: 'INDICADORES DE RESULTADO',
      items: [
        {
          label: 'Resultado Líquido',
          per_head: result_per_head,
          total: result_total,
          bold: true
        },
        {
          label: 'Custo por @ Produzida',
          per_head: cost_per_at_produced,
          total: cost_per_at_produced * data.qtd_animais,
          bold: false
        },
        {
          label: 'Resultado por @ BM',
          per_head: result_per_at_bm,
          total: result_per_at_bm * data.qtd_animais,
          bold: false
        },
        {
          label: 'Retorno Mensal (%)',
          per_head: monthly_return_pct,
          total: null, // No total for percentage
          bold: false,
          isPercentage: true
        }
      ]
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg text-green-700 dark:text-green-400">
          DRE - Pecuarista
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Column Headers */}
          <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground border-b pb-2">
            <div>Item</div>
            <div className="text-right">Unitário/Boi</div>
            <div className="text-right">Lote ({data.qtd_animais} cab.)</div>
          </div>

          {dre_lines.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">
                {section.label}
              </h4>
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`grid grid-cols-3 gap-4 py-1 text-sm ${
                      item.bold ? 'font-bold border-t border-border pt-2' : ''
                    } ${
                      section.label === 'INDICADORES DE RESULTADO' ? (
                        result_per_head >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      ) : ''
                    }`}
                  >
                    <div className="col-span-1 text-left">{item.label}</div>
                    <div className="text-right">
                      {item.isPercentage 
                        ? formatPercentage(item.per_head / 100)
                        : formatCurrency(item.per_head)
                      }
                    </div>
                    <div className="text-right font-medium">
                      {item.total !== null 
                        ? formatCurrency(item.total)
                        : '-'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}