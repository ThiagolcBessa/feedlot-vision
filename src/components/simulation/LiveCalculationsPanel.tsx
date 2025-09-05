import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/services/calculations';
import type { SimulationFormType } from '@/schemas/simulationSchema';

interface LiveCalculationsPanelProps {
  formData: SimulationFormType;
  matrixRow?: any;
  userEditableFields?: {
    frete_confinamento_r: number;
    frete_pecuarista_r: number;
    taxa_abate_r: number;
    icms_devolucao_r: number;
  };
}

export function LiveCalculationsPanel({ 
  formData, 
  matrixRow, 
  userEditableFields 
}: LiveCalculationsPanelProps) {
  // Calculate weights based on scale type
  const calculateEffectiveWeight = () => {
    const fazenda = formData.peso_fazenda_kg || 0;
    const balancao = formData.peso_entrada_balancao_kg || 0;
    const balancinha = formData.peso_entrada_balancinha_kg || 0;
    const quebra_fazenda = formData.quebra_fazenda_pct || 0;
    const quebra_balanca = formData.quebra_balanca_pct || 0;

    switch (formData.scale_type) {
      case 'Fazenda':
        return fazenda * (1 - quebra_fazenda);
      case 'Balanção':
        return balancao * (1 - quebra_balanca);
      case 'Balancinha':
        return balancinha;
      default:
        return 0;
    }
  };

  const Win = calculateEffectiveWeight();
  const Wout = Win + ((formData.gmd_kg_dia || 0) * (formData.dias_cocho || 0));
  const Wavg = (Win + Wout) / 2;

  // Calculate arrobas
  const arrobas_magro = ((formData.peso_fazenda_kg || 0) * (formData.rendimento_boi_magro_prod_pct || 0.5)) / 15;
  const arrobas_gordo = (Wout * (formData.rc_pct || 0.53)) / 15;
  const k_carcaca = 0.61; // Default from unit
  const arrobas_prod = ((formData.gmd_kg_dia || 0) * k_carcaca * (formData.dias_cocho || 0)) / 15;

  // Calculate DMI
  let dmi_kg_dia = formData.dmi_kg_dia || 0;
  if (!dmi_kg_dia && formData.pct_pv) {
    dmi_kg_dia = Wavg * formData.pct_pv;
  }

  // Calculate costs
  const desperdicio = formData.desperdicio_ms_pct || 0.05;
  const custo_alim = dmi_kg_dia * (1 + desperdicio) * (formData.custo_ms_kg || 0) * (formData.dias_cocho || 0);

  // Service revenue
  let receita_boitel = 0;
  if (matrixRow) {
    if (formData.modalidade === 'Arroba Prod.' && matrixRow.tabela_final_r_por_arroba) {
      receita_boitel = matrixRow.tabela_final_r_por_arroba * arrobas_prod;
    } else if (formData.modalidade === 'Diária' && matrixRow.diaria_r_por_cab_dia) {
      receita_boitel = matrixRow.diaria_r_por_cab_dia * (formData.dias_cocho || 0);
    }
  }

  // DRE Pecuarista (unitário)
  const receita_pec = arrobas_gordo * (formData.preco_boi_gordo_r_por_arroba || 0);
  const custo_magro = arrobas_magro * (formData.preco_boi_magro_r_por_arroba || 0) + (formData.agio_magro_r || 0);
  const custo_engorda = receita_boitel;
  const taxas_frete = (userEditableFields?.taxa_abate_r || 0) + (userEditableFields?.frete_pecuarista_r || 0) - (userEditableFields?.icms_devolucao_r || 0);
  const res_pec = receita_pec - custo_magro - custo_engorda - taxas_frete;

  // KPIs Pecuarista
  const custo_por_arroba_produzida = arrobas_prod > 0 ? custo_engorda / arrobas_prod : 0;
  const break_even_r_por_arroba_gordo = arrobas_gordo > 0 ? (custo_magro + custo_engorda + taxas_frete) / arrobas_gordo : 0;
  const roi_mensal_pct = custo_magro + custo_engorda > 0 ? (res_pec / (custo_magro + custo_engorda)) * (30 / (formData.dias_cocho || 1)) * 100 : 0;

  // DRE JBS (unitário)
  const alimentar = custo_alim;
  const frete_conf = userEditableFields?.frete_confinamento_r || 0;
  const sanit_mort = 0.02 * receita_boitel; // 2% default
  const fixos_adm = 0; // Would come from matrix
  const res_jbs = receita_boitel - (alimentar + frete_conf + sanit_mort + fixos_adm);

  // KPIs JBS
  const res_jbs_por_dia = (formData.dias_cocho || 0) > 0 ? res_jbs / (formData.dias_cocho || 0) : 0;
  const res_jbs_por_arroba = arrobas_prod > 0 ? res_jbs / arrobas_prod : 0;

  const hasValidData = Win > 0 && formData.dias_cocho && formData.gmd_kg_dia;

  if (!hasValidData) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">KPIs & Cálculos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Complete os dados para visualizar os cálculos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">KPIs Principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Win:</span>
              <span className="ml-2 font-medium">{Win.toFixed(1)} kg</span>
            </div>
            <div>
              <span className="text-muted-foreground">Wout:</span>
              <span className="ml-2 font-medium">{Wout.toFixed(1)} kg</span>
            </div>
            <div>
              <span className="text-muted-foreground">@ Magro:</span>
              <span className="ml-2 font-medium">{arrobas_magro.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">@ Gordo:</span>
              <span className="ml-2 font-medium">{arrobas_gordo.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">@ Prod:</span>
              <span className="ml-2 font-medium">{arrobas_prod.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">DMI:</span>
              <span className="ml-2 font-medium">{dmi_kg_dia.toFixed(2)} kg/d</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DRE Pecuarista */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">DRE Pecuarista (Unitário)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Receita Boi Gordo:</span>
              <span className="font-medium">{formatCurrency(receita_pec)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Custo Boi Magro:</span>
              <span>({formatCurrency(custo_magro)})</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Custo Engorda:</span>
              <span>({formatCurrency(custo_engorda)})</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Taxas/Frete:</span>
              <span>({formatCurrency(taxas_frete)})</span>
            </div>
            <div className="border-t pt-1">
              <div className="flex justify-between font-medium">
                <span>Resultado:</span>
                <span className={res_pec >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(res_pec)}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Custo por @ Prod:</span>
              <span>{formatCurrency(custo_por_arroba_produzida)}</span>
            </div>
            <div className="flex justify-between">
              <span>Break-even @ Gordo:</span>
              <span>{formatCurrency(break_even_r_por_arroba_gordo)}</span>
            </div>
            <div className="flex justify-between">
              <span>ROI Mensal:</span>
              <span>{roi_mensal_pct.toFixed(2)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DRE JBS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">DRE JBS (Unitário)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Receita Serviço:</span>
              <span className="font-medium">{formatCurrency(receita_boitel)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Alimentar:</span>
              <span>({formatCurrency(alimentar)})</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Frete Conf:</span>
              <span>({formatCurrency(frete_conf)})</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Sanit/Mort:</span>
              <span>({formatCurrency(sanit_mort)})</span>
            </div>
            <div className="border-t pt-1">
              <div className="flex justify-between font-medium">
                <span>Resultado JBS:</span>
                <span className={res_jbs >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(res_jbs)}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Res/Dia:</span>
              <span>{formatCurrency(res_jbs_por_dia)}</span>
            </div>
            <div className="flex justify-between">
              <span>Res/@ Prod:</span>
              <span>{formatCurrency(res_jbs_por_arroba)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lote (if multiple animals) */}
      {formData.qtd_animais && formData.qtd_animais > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resultado Lote ({formData.qtd_animais} cab)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Pecuarista:</span>
              <span className={res_pec * formData.qtd_animais >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(res_pec * formData.qtd_animais)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>JBS:</span>
              <span className={res_jbs * formData.qtd_animais >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(res_jbs * formData.qtd_animais)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}