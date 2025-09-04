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

    // Feed costs breakdown
    feed_cost_total: number;
    dmi_kg_day: number;
    feed_cost_per_kg: number;
    feed_waste_pct: number;

    // Other operational costs
    freight_confinement: number;
    health_cost_total: number;
    mortality_pct: number;
    mortality_cost: number;

    // Fixed costs
    transport_cost_total: number; // CTR
    fixed_cost_daily_total: number; // CF
    overhead_total: number; // Corp
    depreciation_total: number;
    financial_cost_total: number;
    other_fixed_total: number;
  };
  className?: string;
}

export function DreBoitel({ data, className }: DreBoitelProps) {
  // Revenue calculations
  const revenue_per_head = data.modalidade === 'Arroba Prod.' 
    ? data.arroubas_gain * data.service_price
    : data.days_on_feed * data.service_price; // Daily service price
  const revenue_total = revenue_per_head * data.qtd_animais;

  // Individual cost calculations per head
  const feed_cost_per_head = data.feed_cost_total / data.qtd_animais;
  const freight_per_head = data.freight_confinement / data.qtd_animais;
  
  // Sanitary + Mortality combined
  const sanitary_mortality_per_head = (data.health_cost_total + data.mortality_cost) / data.qtd_animais;
  const sanitary_mortality_total = data.health_cost_total + data.mortality_cost;
  
  // Fixed costs per head
  const ctr_per_head = data.transport_cost_total / data.qtd_animais;
  const cf_per_head = data.fixed_cost_daily_total / data.qtd_animais;
  const corp_per_head = data.overhead_total / data.qtd_animais;
  const depr_per_head = data.depreciation_total / data.qtd_animais;
  const fin_per_head = data.financial_cost_total / data.qtd_animais;
  const other_per_head = data.other_fixed_total / data.qtd_animais;

  const total_costs_per_head = feed_cost_per_head + freight_per_head + sanitary_mortality_per_head + 
    ctr_per_head + cf_per_head + corp_per_head + depr_per_head + fin_per_head + other_per_head;
  
  const total_costs_total = total_costs_per_head * data.qtd_animais;

  const result_per_head = revenue_per_head - total_costs_per_head;
  const result_total = result_per_head * data.qtd_animais;
  
  // Result per arroba
  const result_per_arroba = data.arroubas_gain > 0 ? result_per_head / data.arroubas_gain : 0;

  const dre_lines = [
    {
      label: 'RECEITA DE SERVIÇOS',
      items: [
        {
          label: `Engorda ${data.modalidade === 'Arroba Prod.' ? `(${data.arroubas_gain.toFixed(2)}@ × ${formatCurrency(data.service_price)})` : `(${data.days_on_feed}d × ${formatCurrency(data.service_price)}/d)`}`,
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
          label: `Alimentar (${data.dmi_kg_day.toFixed(1)}kg/d × ${data.days_on_feed}d × ${formatCurrency(data.feed_cost_per_kg)} + ${data.feed_waste_pct.toFixed(1)}% desperdício)`,
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
          label: `Sanitário + Mortalidade (${data.mortality_pct.toFixed(1)}%)`,
          per_head: sanitary_mortality_per_head,
          total: sanitary_mortality_total,
          bold: false
        }
      ]
    },
    {
      label: 'CUSTOS FIXOS E ADMINISTRATIVOS',
      items: [
        {
          label: 'CTR (Transporte)',
          per_head: ctr_per_head,
          total: data.transport_cost_total,
          bold: false
        },
        {
          label: 'CF (Custo Fixo Operacional)',
          per_head: cf_per_head,
          total: data.fixed_cost_daily_total,
          bold: false
        },
        {
          label: 'Corporativo (Overhead)',
          per_head: corp_per_head,
          total: data.overhead_total,
          bold: false
        },
        {
          label: 'Depreciação',
          per_head: depr_per_head,
          total: data.depreciation_total,
          bold: false
        },
        {
          label: 'Financeiro',
          per_head: fin_per_head,
          total: data.financial_cost_total,
          bold: false
        },
        {
          label: 'Outros Custos Fixos',
          per_head: other_per_head,
          total: data.other_fixed_total,
          bold: false
        }
      ]
    },
    {
      label: 'INDICADORES DE RESULTADO',
      items: [
        {
          label: 'Resultado JBS',
          per_head: result_per_head,
          total: result_total,
          bold: true
        },
        {
          label: 'Resultado por @ Produzida',
          per_head: result_per_arroba,
          total: result_per_arroba * data.qtd_animais,
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
                        result_per_head >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'
                      ) : ''
                    }`}
                  >
                    <div className="col-span-1 text-left">{item.label}</div>
                    <div className="text-right">
                      {formatCurrency(item.per_head)}
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(item.total)}
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