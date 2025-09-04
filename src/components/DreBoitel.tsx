import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/services/calculations';

interface DreBoitelProps {
  data: {
    // Revenue
    service_price: number;
    modalidade: 'Diária' | 'Arroba Prod.';
    arroubas_gain: number;
    days_on_feed: number;
    qtd_animais: number;

    // Costs
    feed_cost_total: number;
    freight_confinement: number;
    sanitary_mortality: number;
    ctr_cost: number;
    cf_cost: number;
    corp_cost: number;
    depreciation_cost: number;
    financial_cost: number;
    other_fixed: number;

    // Results
    result_jbs_per_head: number;
    result_jbs_total: number;
    result_per_arroba: number;
  };
  className?: string;
}

export function DreBoitel({ data, className }: DreBoitelProps) {
  // Revenue calculations
  const revenue_per_head = data.modalidade === 'Arroba Prod.' 
    ? data.arroubas_gain * data.service_price
    : data.days_on_feed * (data.service_price / 30); // Convert daily rate
  const revenue_total = revenue_per_head * data.qtd_animais;

  // Individual cost calculations per head
  const feed_cost_per_head = data.feed_cost_total / data.qtd_animais;
  const freight_per_head = data.freight_confinement / data.qtd_animais;
  const sanitary_per_head = data.sanitary_mortality / data.qtd_animais;
  const ctr_per_head = data.ctr_cost / data.qtd_animais;
  const cf_per_head = data.cf_cost / data.qtd_animais;
  const corp_per_head = data.corp_cost / data.qtd_animais;
  const depr_per_head = data.depreciation_cost / data.qtd_animais;
  const fin_per_head = data.financial_cost / data.qtd_animais;
  const other_per_head = data.other_fixed / data.qtd_animais;

  const total_costs_per_head = feed_cost_per_head + freight_per_head + sanitary_per_head + 
    ctr_per_head + cf_per_head + corp_per_head + depr_per_head + fin_per_head + other_per_head;
  
  const total_costs_total = total_costs_per_head * data.qtd_animais;

  const result_per_head = revenue_per_head - total_costs_per_head;
  const result_total = result_per_head * data.qtd_animais;

  const dre_lines = [
    {
      label: 'RECEITA',
      items: [
        {
          label: `Serviço ${data.modalidade === 'Arroba Prod.' ? `(${data.arroubas_gain.toFixed(2)}@ × ${formatCurrency(data.service_price)})` : `(${data.days_on_feed}d × ${formatCurrency(data.service_price)}/d)`}`,
          per_head: revenue_per_head,
          total: revenue_total,
          bold: false
        }
      ]
    },
    {
      label: 'CUSTOS OPERACIONAIS',
      items: [
        {
          label: 'Alimentar (MS + Desperdício)',
          per_head: feed_cost_per_head,
          total: data.feed_cost_total,
          bold: false
        },
        {
          label: 'Frete Confinamento',
          per_head: freight_per_head,
          total: data.freight_confinement,
          bold: false
        },
        {
          label: 'Sanitário + Mortalidade',
          per_head: sanitary_per_head,
          total: data.sanitary_mortality,
          bold: false
        }
      ]
    },
    {
      label: 'CUSTOS FIXOS',
      items: [
        {
          label: 'CTR',
          per_head: ctr_per_head,
          total: data.ctr_cost,
          bold: false
        },
        {
          label: 'CF (Custo Fixo)',
          per_head: cf_per_head,
          total: data.cf_cost,
          bold: false
        },
        {
          label: 'Corporativo',
          per_head: corp_per_head,
          total: data.corp_cost,
          bold: false
        },
        {
          label: 'Depreciação',
          per_head: depr_per_head,
          total: data.depreciation_cost,
          bold: false
        },
        {
          label: 'Financeiro',
          per_head: fin_per_head,
          total: data.financial_cost,
          bold: false
        },
        {
          label: 'Outros Fixos',
          per_head: other_per_head,
          total: data.other_fixed,
          bold: false
        }
      ]
    },
    {
      label: 'RESULTADO',
      items: [
        {
          label: 'Resultado JBS',
          per_head: result_per_head,
          total: result_total,
          bold: true
        },
        {
          label: 'Resultado por @',
          per_head: data.result_per_arroba,
          total: data.result_per_arroba * data.qtd_animais * data.arroubas_gain,
          bold: false
        }
      ]
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg text-blue-700 dark:text-blue-400">
          DRE - JBS Boitel
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
                    <div className="text-right">{formatCurrency(item.per_head)}</div>
                    <div className="text-right font-medium">{formatCurrency(item.total)}</div>
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