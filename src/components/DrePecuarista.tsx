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

    // Results
    result_per_head: number;
    result_total: number;
    cost_per_at_produced: number;
    result_per_at_bm: number;
    monthly_return_pct: number;
  };
  className?: string;
}

export function DrePecuarista({ data, className }: DrePecuaristaProps) {
  // Calculations
  const revenue_per_head = data.arroubas_hook * data.price_fat_r_per_at;
  const revenue_total = revenue_per_head * data.qtd_animais;

  const lean_cost_per_head = (data.arroubas_magro * data.price_lean_r_per_at) + data.agio_r;
  const lean_cost_total = lean_cost_per_head * data.qtd_animais;

  const fattening_cost_per_head = data.modalidade === 'Arroba Prod.' 
    ? data.arroubas_gain * data.service_price
    : data.days_on_feed * (data.service_price / 30); // Convert daily rate
  const fattening_cost_total = fattening_cost_per_head * data.qtd_animais;

  const fees_freight_per_head = (data.taxa_abate || 0) + (data.frete_pecuarista || 0);
  const fees_freight_total = fees_freight_per_head * data.qtd_animais;

  const total_cost_per_head = lean_cost_per_head + fattening_cost_per_head + fees_freight_per_head;
  const total_cost_total = total_cost_per_head * data.qtd_animais;

  const result_per_head = revenue_per_head - total_cost_per_head;
  const result_total = result_per_head * data.qtd_animais;

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
      label: 'CUSTOS',
      items: [
        {
          label: `Boi Magro (${data.arroubas_magro.toFixed(2)}@ × ${formatCurrency(data.price_lean_r_per_at)}${data.agio_r !== 0 ? ` ${data.agio_r > 0 ? '+' : ''}${formatCurrency(data.agio_r)}` : ''})`,
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
          label: 'Taxas + Frete',
          per_head: fees_freight_per_head,
          total: fees_freight_total,
          bold: false
        }
      ]
    },
    {
      label: 'RESULTADO',
      items: [
        {
          label: 'Resultado Líquido',
          per_head: result_per_head,
          total: result_total,
          bold: true
        },
        {
          label: 'Custo por @ Produzida',
          per_head: data.cost_per_at_produced,
          total: data.cost_per_at_produced * data.qtd_animais * data.arroubas_gain,
          bold: false
        },
        {
          label: 'Resultado por @ BM',
          per_head: data.result_per_at_bm,
          total: data.result_per_at_bm * data.qtd_animais * data.arroubas_magro,
          bold: false
        },
        {
          label: 'Retorno Mensal (%)',
          per_head: data.monthly_return_pct,
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
                      section.label === 'RESULTADO' ? 'text-primary' : ''
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
          
          {/* Column Headers */}
          <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground border-b pb-1 mt-4 pt-4">
            <div>Item</div>
            <div className="text-right">Unitário/Boi</div>
            <div className="text-right">Lote ({data.qtd_animais} cab.)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}