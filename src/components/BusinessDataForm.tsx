import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp } from 'lucide-react';
import { HistoricalHint } from './HistoricalHint';
import { formatCurrency, formatWeight, formatPercentage } from '@/services/calculations';
import { 
  fetchUnits, 
  fetchDietasForUnit, 
  fetchAnimalTypesForSelection,
  fetchModalidadesForSelection,
  MatrixSuggestions 
} from '@/services/unitMatrix';

export interface BusinessDataState {
  pecuarista_name: string;
  originator_id: string;
  date_ref: string;
  unit_code: string;
  dieta: string;
  scale_type: string;
  quebra_fazenda_pct: number;
  quebra_balanca_pct: number;
  modalidade: string;
  qtd_animais: number;
  peso_fazenda_kg: number;
  peso_entrada_balancao_kg: number;
  peso_entrada_balancinha_kg: number;
  tipo_animal: string;
  rendimento_boi_magro_prod_pct: number;
  preco_boi_magro_r_por_arroba: number;
  preco_boi_gordo_r_por_arroba: number;
  agio_magro_r: number;
}

interface BusinessDataFormProps {
  data: BusinessDataState;
  onChange: (data: BusinessDataState) => void;
  profiles: Array<{ id: string; first_name: string; last_name: string }>;
  matrixSuggestions: MatrixSuggestions | null;
  onMatrixLookup: () => void;
  onShowPremises: () => void;
  entryWeight: number;
}

export function BusinessDataForm({ 
  data, 
  onChange, 
  profiles, 
  matrixSuggestions, 
  onMatrixLookup,
  onShowPremises,
  entryWeight
}: BusinessDataFormProps) {
  const [units, setUnits] = useState<Array<{ code: string; name: string; state: string }>>([]);
  const [dietas, setDietas] = useState<string[]>([]);
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [historicalHints] = useState({
    quebra_fazenda_pct: { unit_median: 1.2, originator_median: 1.1 },
    quebra_balanca_pct: { unit_median: 0.8, originator_median: 0.9 },
    qtd_animais: { unit_median: 150, originator_median: 120 },
    peso_fazenda_kg: { unit_median: 385, originator_median: 390 },
    peso_entrada_balancao_kg: { unit_median: 380, originator_median: 385 },
    peso_entrada_balancinha_kg: { unit_median: 378, originator_median: 383 },
    rendimento_boi_magro_prod_pct: { unit_median: 52.5, originator_median: 53.0 },
    preco_boi_magro_r_por_arroba: { unit_median: 165.0, originator_median: 168.0 },
    preco_boi_gordo_r_por_arroba: { unit_median: 185.0, originator_median: 187.0 },
    agio_magro_r: { unit_median: 2.5, originator_median: 2.8 }
  });

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    if (data.unit_code) {
      loadDietas();
    }
  }, [data.unit_code]);

  useEffect(() => {
    if (data.unit_code && data.dieta) {
      loadAnimalTypes();
    }
  }, [data.unit_code, data.dieta]);

  useEffect(() => {
    if (data.unit_code && data.dieta && data.tipo_animal) {
      loadModalidades();
    }
  }, [data.unit_code, data.dieta, data.tipo_animal]);

  useEffect(() => {
    if (data.unit_code && data.modalidade && data.dieta && data.tipo_animal && entryWeight > 0) {
      onMatrixLookup();
    }
  }, [data.unit_code, data.modalidade, data.dieta, data.tipo_animal, entryWeight]);

  const loadUnits = async () => {
    const unitsData = await fetchUnits();
    setUnits(unitsData);
  };

  const loadDietas = async () => {
    const dietasData = await fetchDietasForUnit(data.unit_code);
    setDietas(dietasData);
  };

  const loadAnimalTypes = async () => {
    const typesData = await fetchAnimalTypesForSelection(data.unit_code, data.dieta);
    setAnimalTypes(typesData);
  };

  const loadModalidades = async () => {
    const modalidadesData = await fetchModalidadesForSelection(data.unit_code, data.dieta, data.tipo_animal);
    setModalidades(modalidadesData);
  };

  const handleFieldChange = (field: keyof BusinessDataState, value: string | number) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Dados do Negócio
          {matrixSuggestions?.concat_label && (
            <Badge variant="secondary" className="ml-auto font-mono text-xs">
              {matrixSuggestions.concat_label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pecuarista">Pecuarista *</Label>
            <Input
              id="pecuarista"
              value={data.pecuarista_name}
              onChange={(e) => handleFieldChange('pecuarista_name', e.target.value)}
              placeholder="Nome do pecuarista"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="originator">Originador *</Label>
            <Select 
              value={data.originator_id} 
              onValueChange={(value) => handleFieldChange('originator_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o originador" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.first_name} {profile.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_ref">Data de Referência *</Label>
            <Input
              id="date_ref"
              type="date"
              value={data.date_ref}
              onChange={(e) => handleFieldChange('date_ref', e.target.value)}
            />
          </div>
        </div>

        {/* Unidade e Configuração */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Select 
              value={data.unit_code} 
              onValueChange={(value) => handleFieldChange('unit_code', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.code} value={unit.code}>
                    {unit.code} - {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dieta">Dieta *</Label>
            <Select 
              value={data.dieta} 
              onValueChange={(value) => handleFieldChange('dieta', value)}
              disabled={!data.unit_code}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a dieta" />
              </SelectTrigger>
              <SelectContent>
                {dietas.map((dieta) => (
                  <SelectItem key={dieta} value={dieta}>
                    {dieta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scale_type">Tipo de Balança *</Label>
            <Select 
              value={data.scale_type} 
              onValueChange={(value) => handleFieldChange('scale_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Balancão">Balancão</SelectItem>
                <SelectItem value="Balancinha">Balancinha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modalidade">Modalidade *</Label>
            <Select 
              value={data.modalidade} 
              onValueChange={(value) => handleFieldChange('modalidade', value)}
              disabled={!data.tipo_animal}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione modalidade" />
              </SelectTrigger>
              <SelectContent>
                {modalidades.map((modalidade) => (
                  <SelectItem key={modalidade} value={modalidade}>
                    {modalidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quebras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quebra_fazenda">Quebra Fazenda (%)</Label>
            <Input
              id="quebra_fazenda"
              type="number"
              step="0.1"
              value={data.quebra_fazenda_pct}
              onChange={(e) => handleFieldChange('quebra_fazenda_pct', parseFloat(e.target.value) || 0)}
            />
            <HistoricalHint 
              fieldName="quebra_fazenda_pct" 
              hints={historicalHints.quebra_fazenda_pct}
              formatter={formatPercentage}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quebra_balanca">Quebra Balança (%)</Label>
            <Input
              id="quebra_balanca"
              type="number"
              step="0.1"
              value={data.quebra_balanca_pct}
              onChange={(e) => handleFieldChange('quebra_balanca_pct', parseFloat(e.target.value) || 0)}
            />
            <HistoricalHint 
              fieldName="quebra_balanca_pct" 
              hints={historicalHints.quebra_balanca_pct}
              formatter={formatPercentage}
            />
          </div>
        </div>

        {/* Lote e Pesos */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Lote & Pesos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qtd_animais">Qtd. Animais</Label>
              <Input
                id="qtd_animais"
                type="number"
                value={data.qtd_animais}
                onChange={(e) => handleFieldChange('qtd_animais', parseInt(e.target.value) || 0)}
              />
              <HistoricalHint 
                fieldName="qtd_animais" 
                hints={historicalHints.qtd_animais}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_animal">Tipo Animal *</Label>
              <Select 
                value={data.tipo_animal} 
                onValueChange={(value) => handleFieldChange('tipo_animal', value)}
                disabled={!data.dieta}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione tipo" />
                </SelectTrigger>
                <SelectContent>
                  {animalTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso_fazenda">Peso Fazenda (kg)</Label>
              <Input
                id="peso_fazenda"
                type="number"
                step="0.1"
                value={data.peso_fazenda_kg}
                onChange={(e) => handleFieldChange('peso_fazenda_kg', parseFloat(e.target.value) || 0)}
              />
              <HistoricalHint 
                fieldName="peso_fazenda_kg" 
                hints={historicalHints.peso_fazenda_kg}
                formatter={formatWeight}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso_balancao">Peso Balancão (kg)</Label>
              <Input
                id="peso_balancao"
                type="number"
                step="0.1"
                value={data.peso_entrada_balancao_kg}
                onChange={(e) => handleFieldChange('peso_entrada_balancao_kg', parseFloat(e.target.value) || 0)}
              />
              <HistoricalHint 
                fieldName="peso_entrada_balancao_kg" 
                hints={historicalHints.peso_entrada_balancao_kg}
                formatter={formatWeight}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso_balancinha">Peso Balancinha (kg)</Label>
              <Input
                id="peso_balancinha"
                type="number"
                step="0.1"
                value={data.peso_entrada_balancinha_kg}
                onChange={(e) => handleFieldChange('peso_entrada_balancinha_kg', parseFloat(e.target.value) || 0)}
              />
              <HistoricalHint 
                fieldName="peso_entrada_balancinha_kg" 
                hints={historicalHints.peso_entrada_balancinha_kg}
                formatter={formatWeight}
              />
            </div>
          </div>
        </div>

        {/* Zootécnicos */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Zootécnicos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rendimento">Rendimento Boi Magro (%)</Label>
              <Input
                id="rendimento"
                type="number"
                step="0.1"
                value={data.rendimento_boi_magro_prod_pct}
                onChange={(e) => handleFieldChange('rendimento_boi_magro_prod_pct', parseFloat(e.target.value) || 0)}
              />
              <HistoricalHint 
                fieldName="rendimento_boi_magro_prod_pct" 
                hints={historicalHints.rendimento_boi_magro_prod_pct}
                formatter={formatPercentage}
              />
            </div>
          </div>
        </div>

        {/* Mercado */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Mercado</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_magro">Preço Boi Magro (R$/@)</Label>
              <Input
                id="preco_magro"
                type="number"
                step="0.01"
                value={data.preco_boi_magro_r_por_arroba}
                onChange={(e) => handleFieldChange('preco_boi_magro_r_por_arroba', parseFloat(e.target.value) || 0)}
              />
              <HistoricalHint 
                fieldName="preco_boi_magro_r_por_arroba" 
                hints={historicalHints.preco_boi_magro_r_por_arroba}
                formatter={formatCurrency}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_gordo">Preço Boi Gordo (R$/@)</Label>
              <Input
                id="preco_gordo"
                type="number"
                step="0.01"
                value={data.preco_boi_gordo_r_por_arroba}
                onChange={(e) => handleFieldChange('preco_boi_gordo_r_por_arroba', parseFloat(e.target.value) || 0)}
              />
              <HistoricalHint 
                fieldName="preco_boi_gordo_r_por_arroba" 
                hints={historicalHints.preco_boi_gordo_r_por_arroba}
                formatter={formatCurrency}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agio_magro">Ágio Magro (R$)</Label>
              <Input
                id="agio_magro"
                type="number"
                step="0.01"
                value={data.agio_magro_r}
                onChange={(e) => handleFieldChange('agio_magro_r', parseFloat(e.target.value) || 0)}
              />
              <HistoricalHint 
                fieldName="agio_magro_r" 
                hints={historicalHints.agio_magro_r}
                formatter={formatCurrency}
              />
            </div>
          </div>
        </div>

        {/* Suggestions Panel */}
        {matrixSuggestions && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sugestões da Matriz de Preços
              </h4>
              <Button variant="outline" size="sm" onClick={onShowPremises}>
                Ver Premissas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matrixSuggestions.service_price && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Preço Serviço</div>
                  <div className="font-medium">
                    {formatCurrency(matrixSuggestions.service_price)} 
                    {data.modalidade === 'Arroba Prod.' ? '/@' : '/cab/dia'}
                  </div>
                </div>
              )}
              {matrixSuggestions.service_price_base && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Preço Base</div>
                  <div className="font-medium">
                    {formatCurrency(matrixSuggestions.service_price_base)}
                    {data.modalidade === 'Arroba Prod.' ? '/@' : '/cab/dia'}
                  </div>
                </div>
              )}
              {matrixSuggestions.dias_cocho && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Sugestão Dias</div>
                  <div className="font-medium">{matrixSuggestions.dias_cocho} dias</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}