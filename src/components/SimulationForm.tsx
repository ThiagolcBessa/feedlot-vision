import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { HistoricalHint } from '@/components/HistoricalHint';
import { 
  fetchUnits,
  fetchDietasForUnit,
  fetchAnimalTypesForSelection,
  type MatrixSuggestions 
} from '@/services/unitMatrix';
import type { SimulationFormType } from '@/schemas/simulationSchema';

interface SimulationFormProps {
  data: SimulationFormType;
  onChange: (data: SimulationFormType) => void;
  profiles: Array<{ id: string; first_name: string; last_name: string }>;
  matrixSuggestions?: MatrixSuggestions | null;
  onMatrixLookup?: () => void;
  onShowPremises?: () => void;
  historicalHints?: {[key: string]: { unit_median?: number; originator_median?: number }};
}

export function SimulationForm({
  data,
  onChange,
  profiles,
  matrixSuggestions,
  onMatrixLookup,
  onShowPremises,
  historicalHints = {}
}: SimulationFormProps) {
  const [units, setUnits] = useState<Array<{ code: string; name: string; state: string }>>([]);
  const [dietas, setDietas] = useState<string[]>([]);
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const unitsData = await fetchUnits();
      setUnits(unitsData);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const handleFieldChange = (field: keyof SimulationFormType, value: any) => {
    onChange({ ...data, [field]: value });
  };

  // Convert percentage input to fraction for storage
  const handlePercentageChange = (field: keyof SimulationFormType, percentValue: number) => {
    handleFieldChange(field, percentValue / 100);
  };

  // Convert fraction from storage to percentage for display
  const getPercentageValue = (field: keyof SimulationFormType): number => {
    const value = data[field] as number;
    return value ? value * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* IDENTIFICAÇÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400">Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pecuarista">Pecuarista</Label>
              <Input
                id="pecuarista"
                value={data.pecuarista_name || ''}
                onChange={(e) => handleFieldChange('pecuarista_name', e.target.value.toUpperCase())}
                placeholder="NOME DO PECUARISTA"
                className="bg-blue-50 border-blue-200 uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originator">Originador</Label>
              <Select 
                value={data.originator_id || ''} 
                onValueChange={(value) => handleFieldChange('originator_id', value)}
              >
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="Selecione o originador" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.first_name} {profile.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_ref">Data Referência</Label>
              <Input
                id="date_ref"
                type="date"
                value={data.date_ref ? new Date(data.date_ref).toISOString().split('T')[0] : ''}
                onChange={(e) => handleFieldChange('date_ref', new Date(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select 
                value={data.unit_code || ''} 
                onValueChange={async (value) => {
                  handleFieldChange('unit_code', value);
                  if (value) {
                    const dietasData = await fetchDietasForUnit(value);
                    setDietas(dietasData);
                  }
                }}
              >
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.code} value={unit.code}>
                      {unit.name} ({unit.state})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dieta">Dieta</Label>
              <Select 
                value={data.dieta || ''} 
                onValueChange={(value) => handleFieldChange('dieta', value)}
                disabled={!data.unit_code}
              >
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="Selecione a dieta" />
                </SelectTrigger>
                <SelectContent>
                  {dietas.map(dieta => (
                    <SelectItem key={dieta} value={dieta}>
                      {dieta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scale_type">Escala</Label>
              <Select 
                value={data.scale_type || ''} 
                onValueChange={(value) => handleFieldChange('scale_type', value)}
              >
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fazenda">Fazenda</SelectItem>
                  <SelectItem value="Balanção">Balanção</SelectItem>
                  <SelectItem value="Balancinha">Balancinha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modalidade">Modalidade</Label>
              <Select 
                value={data.modalidade || ''} 
                onValueChange={(value) => handleFieldChange('modalidade', value)}
              >
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diária">Diária</SelectItem>
                  <SelectItem value="Arroba Prod.">Arroba Prod.</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="quebra_fazenda">Quebra Fazenda (%)</Label>
              <Input
                id="quebra_fazenda"
                type="number"
                step="0.1"
                value={getPercentageValue('quebra_fazenda_pct')}
                onChange={(e) => handlePercentageChange('quebra_fazenda_pct', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quebra_balanca">Quebra Balança (%)</Label>
              <Input
                id="quebra_balanca"
                type="number"
                step="0.1"
                value={getPercentageValue('quebra_balanca_pct')}
                onChange={(e) => handlePercentageChange('quebra_balanca_pct', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LOTE & PESOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400">Lote & Pesos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qtd_animais">Qtd Cabeças</Label>
              <Input
                id="qtd_animais"
                type="number"
                value={data.qtd_animais || ''}
                onChange={(e) => handleFieldChange('qtd_animais', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_animal">Tipo Animal</Label>
              <Select 
                value={data.tipo_animal || ''} 
                onValueChange={(value) => handleFieldChange('tipo_animal', value)}
              >
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Macho">Macho</SelectItem>
                  <SelectItem value="Fêmea">Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso_fazenda">Peso Fazenda (kg)</Label>
              <Input
                id="peso_fazenda"
                type="number"
                step="0.1"
                value={data.peso_fazenda_kg || ''}
                onChange={(e) => handleFieldChange('peso_fazenda_kg', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso_balancao">Peso Entrada - Balanção (kg)</Label>
              <Input
                id="peso_balancao"
                type="number"
                step="0.1"
                value={data.peso_entrada_balancao_kg || ''}
                onChange={(e) => handleFieldChange('peso_entrada_balancao_kg', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso_balancinha">Peso Entrada - Balancinha (kg)</Label>
              <Input
                id="peso_balancinha"
                type="number"
                step="0.1"
                value={data.peso_entrada_balancinha_kg || ''}
                onChange={(e) => handleFieldChange('peso_entrada_balancinha_kg', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ZOOTÉCNICOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400">Zootécnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dias_cocho">Dias no Cocho</Label>
              <Input
                id="dias_cocho"
                type="number"
                value={data.dias_cocho || ''}
                onChange={(e) => handleFieldChange('dias_cocho', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
              <HistoricalHint 
                fieldName="dias_cocho" 
                hints={historicalHints.dias_cocho || {}}
                formatter={(v) => `${v} dias`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gmd">GMD (kg/d)</Label>
              <Input
                id="gmd"
                type="number"
                step="0.1"
                value={data.gmd_kg_dia || ''}
                onChange={(e) => handleFieldChange('gmd_kg_dia', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
              <HistoricalHint 
                fieldName="gmd_kg_dia" 
                hints={historicalHints.gmd_kg_dia || {}}
                formatter={(v) => `${v} kg/d`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rc">RC (%)</Label>
              <Input
                id="rc"
                type="number"
                step="0.1"
                value={getPercentageValue('rc_pct')}
                onChange={(e) => handlePercentageChange('rc_pct', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dmi">DMI (kg/d)</Label>
              <Input
                id="dmi"
                type="number"
                step="0.1"
                value={data.dmi_kg_dia || ''}
                onChange={(e) => handleFieldChange('dmi_kg_dia', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
              <HistoricalHint 
                fieldName="dmi_kg_dia" 
                hints={historicalHints.dmi_kg_dia || {}}
                formatter={(v) => `${v} kg/d`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custo_ms">Custo MS (R$/kg)</Label>
              <Input
                id="custo_ms"
                type="number"
                step="0.01"
                value={data.custo_ms_kg || ''}
                onChange={(e) => handleFieldChange('custo_ms_kg', Number(e.target.value))}
                className="bg-blue-50 border-blue-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MERCADO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400">Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rendimento Boi Magro (%): {getPercentageValue('rendimento_boi_magro_prod_pct').toFixed(1)}%</Label>
              <Slider
                value={[getPercentageValue('rendimento_boi_magro_prod_pct')]}
                onValueChange={([value]) => handlePercentageChange('rendimento_boi_magro_prod_pct', value)}
                min={45}
                max={60}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>45%</span>
                <span>60%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco_magro">Preço Boi Magro (R$/@)</Label>
                <Input
                  id="preco_magro"
                  type="number"
                  step="0.01"
                  value={data.preco_boi_magro_r_por_arroba || ''}
                  onChange={(e) => handleFieldChange('preco_boi_magro_r_por_arroba', Number(e.target.value))}
                  className="bg-blue-50 border-blue-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_gordo">Preço Boi Gordo (R$/@)</Label>
                <Input
                  id="preco_gordo"
                  type="number"
                  step="0.01"
                  value={data.preco_boi_gordo_r_por_arroba || ''}
                  onChange={(e) => handleFieldChange('preco_boi_gordo_r_por_arroba', Number(e.target.value))}
                  className="bg-blue-50 border-blue-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agio">Ágio Magro (R$)</Label>
                <Input
                  id="agio"
                  type="number"
                  step="0.01"
                  value={data.agio_magro_r || ''}
                  onChange={(e) => handleFieldChange('agio_magro_r', Number(e.target.value))}
                  className="bg-blue-50 border-blue-200"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PREÇO DE SERVIÇO & ETIQUETA (Read-only) */}
      {matrixSuggestions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
              Preço de Serviço & Etiqueta
              {onShowPremises && (
                <Button variant="ghost" size="sm" onClick={onShowPremises}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Valores calculados automaticamente baseados na matriz de preços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Preço Base (R$/@)</Label>
                <Input
                  value={matrixSuggestions.service_price?.toFixed(2) || '0.00'}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Serviço ({data.modalidade === 'Diária' ? 'R$/cab/dia' : 'R$/@'})</Label>
                <Input
                  value={matrixSuggestions.service_price?.toFixed(2) || '0.00'}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label>Etiqueta</Label>
                <Badge variant="secondary" className="text-sm">
                  {matrixSuggestions.concat_label || 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}