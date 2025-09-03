import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calculator, Save, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateSimulation, formatCurrency, formatWeight, formatArroubas, formatPercentage } from '@/services/calculations';
import type { SimulationInput, SimulationResult } from '@/services/calculations';

export default function Simulation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('animal');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<SimulationInput> & { title: string; notes?: string }>({
    title: '',
    // Animal & Performance defaults
    entry_weight_kg: 300,
    days_on_feed: 120,
    adg_kg_day: 1.4,
    dmi_pct_bw: 2.5,
    mortality_pct: 2.0,
    feed_waste_pct: 5.0,
    
    // Prices & Costs defaults
    selling_price_per_at: 350,
    feed_cost_kg_dm: 0.45,
    health_cost_total: 45,
    transport_cost_total: 25,
    financial_cost_total: 0,
    depreciation_total: 0,
    overhead_total: 0,
    
    notes: ''
  });

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setSimulationId(editId);
      loadSimulation(editId);
    }
  }, [searchParams]);

  const loadSimulation = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        entry_weight_kg: data.entry_weight_kg,
        days_on_feed: data.days_on_feed,
        adg_kg_day: data.adg_kg_day,
        dmi_pct_bw: data.dmi_pct_bw,
        dmi_kg_day: data.dmi_kg_day,
        mortality_pct: data.mortality_pct,
        feed_waste_pct: data.feed_waste_pct,
        purchase_price_per_at: data.purchase_price_per_at,
        purchase_price_per_kg: data.purchase_price_per_kg,
        selling_price_per_at: data.selling_price_per_at,
        feed_cost_kg_dm: data.feed_cost_kg_dm,
        health_cost_total: data.health_cost_total,
        transport_cost_total: data.transport_cost_total,
        financial_cost_total: data.financial_cost_total,
        depreciation_total: data.depreciation_total,
        overhead_total: data.overhead_total,
        notes: data.notes,
      });
    } catch (error) {
      console.error('Error loading simulation:', error);
      toast({
        title: "Erro ao carregar simulação",
        description: "Não foi possível carregar os dados da simulação.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (isNaN(Number(value)) ? value : Number(value)) : value
    }));
  };

  const handleCalculate = () => {
    if (!validateForm()) return;
    
    setIsCalculating(true);
    
    try {
      const input: SimulationInput = {
        entry_weight_kg: formData.entry_weight_kg!,
        days_on_feed: formData.days_on_feed!,
        adg_kg_day: formData.adg_kg_day!,
        dmi_pct_bw: formData.dmi_pct_bw,
        dmi_kg_day: formData.dmi_kg_day,
        mortality_pct: formData.mortality_pct!,
        feed_waste_pct: formData.feed_waste_pct!,
        purchase_price_per_at: formData.purchase_price_per_at,
        purchase_price_per_kg: formData.purchase_price_per_kg,
        selling_price_per_at: formData.selling_price_per_at!,
        feed_cost_kg_dm: formData.feed_cost_kg_dm!,
        health_cost_total: formData.health_cost_total!,
        transport_cost_total: formData.transport_cost_total!,
        financial_cost_total: formData.financial_cost_total!,
        depreciation_total: formData.depreciation_total!,
        overhead_total: formData.overhead_total!,
      };

      const calculationResult = calculateSimulation(input);
      setResult(calculationResult);
      setActiveTab('results');
      
      toast({
        title: "Cálculo concluído",
        description: "Os resultados da simulação foram calculados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no cálculo",
        description: "Ocorreu um erro ao calcular a simulação. Verifique os dados inseridos.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !result || !user) return;

    setIsSaving(true);

    try {
      let simulation;
      
      if (isEditing && simulationId) {
        // Update existing simulation
        const { data, error: simError } = await supabase
          .from('simulations')
          .update({
          title: formData.title,
          entry_weight_kg: formData.entry_weight_kg!,
          days_on_feed: formData.days_on_feed!,
          adg_kg_day: formData.adg_kg_day!,
          dmi_pct_bw: formData.dmi_pct_bw,
          dmi_kg_day: formData.dmi_kg_day,
          purchase_price_per_at: formData.purchase_price_per_at,
          purchase_price_per_kg: formData.purchase_price_per_kg,
          selling_price_per_at: formData.selling_price_per_at!,
          health_cost_total: formData.health_cost_total!,
          transport_cost_total: formData.transport_cost_total!,
          financial_cost_total: formData.financial_cost_total!,
          depreciation_total: formData.depreciation_total!,
          overhead_total: formData.overhead_total!,
          feed_cost_kg_dm: formData.feed_cost_kg_dm!,
          feed_waste_pct: formData.feed_waste_pct!,
          mortality_pct: formData.mortality_pct!,
          notes: formData.notes,
        })
        .eq('id', simulationId)
        .select()
        .single();

        if (simError) throw simError;
        simulation = data;
      } else {
        // Create new simulation
        const { data, error: simError } = await supabase
          .from('simulations')
          .insert({
            title: formData.title,
            entry_weight_kg: formData.entry_weight_kg!,
            days_on_feed: formData.days_on_feed!,
            adg_kg_day: formData.adg_kg_day!,
            dmi_pct_bw: formData.dmi_pct_bw,
            dmi_kg_day: formData.dmi_kg_day,
            purchase_price_per_at: formData.purchase_price_per_at,
            purchase_price_per_kg: formData.purchase_price_per_kg,
            selling_price_per_at: formData.selling_price_per_at!,
            health_cost_total: formData.health_cost_total!,
            transport_cost_total: formData.transport_cost_total!,
            financial_cost_total: formData.financial_cost_total!,
            depreciation_total: formData.depreciation_total!,
            overhead_total: formData.overhead_total!,
            feed_cost_kg_dm: formData.feed_cost_kg_dm!,
            feed_waste_pct: formData.feed_waste_pct!,
            mortality_pct: formData.mortality_pct!,
            notes: formData.notes,
          })
          .select()
          .single();

        if (simError) throw simError;
        simulation = data;
      }

      // Delete existing results if editing
      if (isEditing && simulationId) {
        await supabase
          .from('simulation_results')
          .delete()
          .eq('simulation_id', simulationId);
      }

      // Save new results
      const { error: resultError } = await supabase
        .from('simulation_results')
        .insert({
          simulation_id: simulation.id,
          exit_weight_kg: result.exit_weight_kg,
          carcass_weight_kg: result.carcass_weight_kg,
          arroubas_hook: result.arroubas_hook,
          arroubas_gain: result.arroubas_gain,
          cost_per_animal: result.cost_per_animal,
          cost_per_arrouba: result.cost_per_arrouba,
          margin_total: result.margin_total,
          spread_r_per_at: result.spread_r_per_at,
          break_even_r_per_at: result.break_even_r_per_at,
          roi_pct: result.roi_pct,
          payback_days: result.payback_days,
        });

      if (resultError) throw resultError;

      toast({
        title: isEditing ? "Simulação atualizada" : "Simulação salva",
        description: isEditing ? "A simulação foi atualizada com sucesso." : "A simulação foi salva com sucesso.",
      });

      navigate(`/results/${simulation.id}`);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a simulação.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para a simulação.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.purchase_price_per_at && !formData.purchase_price_per_kg) {
      toast({
        title: "Preço de compra obrigatório",
        description: "Por favor, insira o preço de compra por @ ou por kg.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isEditing ? 'Editar Simulação' : 'Nova Simulação'}
        </h1>
        <p className="text-muted-foreground">
          Configure os parâmetros da simulação de viabilidade do confinamento
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="animal">Animal & Performance</TabsTrigger>
          <TabsTrigger value="costs">Preços & Custos</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="animal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Animal e Performance</CardTitle>
              <CardDescription>
                Configure o peso inicial, ganho de peso e consumo dos animais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Simulação *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Boi 300kg - 120 dias"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entry_weight">Peso de Entrada (kg) *</Label>
                  <Input
                    id="entry_weight"
                    type="number"
                    value={formData.entry_weight_kg}
                    onChange={(e) => handleInputChange('entry_weight_kg', e.target.value)}
                    placeholder="300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days_on_feed">Dias de Confinamento *</Label>
                  <Input
                    id="days_on_feed"
                    type="number"
                    value={formData.days_on_feed}
                    onChange={(e) => handleInputChange('days_on_feed', e.target.value)}
                    placeholder="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adg">Ganho Médio Diário (kg/dia) *</Label>
                  <Input
                    id="adg"
                    type="number"
                    step="0.1"
                    value={formData.adg_kg_day}
                    onChange={(e) => handleInputChange('adg_kg_day', e.target.value)}
                    placeholder="1.4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dmi_pct">Consumo MS (% Peso Vivo)</Label>
                  <Input
                    id="dmi_pct"
                    type="number"
                    step="0.1"
                    value={formData.dmi_pct_bw}
                    onChange={(e) => handleInputChange('dmi_pct_bw', e.target.value)}
                    placeholder="2.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mortality">Mortalidade (%)</Label>
                  <Input
                    id="mortality"
                    type="number"
                    step="0.1"
                    value={formData.mortality_pct}
                    onChange={(e) => handleInputChange('mortality_pct', e.target.value)}
                    placeholder="2.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waste">Desperdício de Ração (%)</Label>
                  <Input
                    id="waste"
                    type="number"
                    step="0.1"
                    value={formData.feed_waste_pct}
                    onChange={(e) => handleInputChange('feed_waste_pct', e.target.value)}
                    placeholder="5.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preços e Custos</CardTitle>
              <CardDescription>
                Configure os preços de compra, venda e custos operacionais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_at">Preço Compra (R$/@)</Label>
                  <Input
                    id="purchase_at"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price_per_at || ''}
                    onChange={(e) => handleInputChange('purchase_price_per_at', e.target.value)}
                    placeholder="280.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_kg">Preço Compra (R$/kg)</Label>
                  <Input
                    id="purchase_kg"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price_per_kg || ''}
                    onChange={(e) => handleInputChange('purchase_price_per_kg', e.target.value)}
                    placeholder="18.67"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selling_at">Preço Venda (R$/@) *</Label>
                  <Input
                    id="selling_at"
                    type="number"
                    step="0.01"
                    value={formData.selling_price_per_at}
                    onChange={(e) => handleInputChange('selling_price_per_at', e.target.value)}
                    placeholder="350.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feed_cost">Custo Ração MS (R$/kg MS) *</Label>
                  <Input
                    id="feed_cost"
                    type="number"
                    step="0.01"
                    value={formData.feed_cost_kg_dm}
                    onChange={(e) => handleInputChange('feed_cost_kg_dm', e.target.value)}
                    placeholder="0.45"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="health_cost">Custo Sanidade Total (R$)</Label>
                  <Input
                    id="health_cost"
                    type="number"
                    step="0.01"
                    value={formData.health_cost_total}
                    onChange={(e) => handleInputChange('health_cost_total', e.target.value)}
                    placeholder="45.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transport_cost">Custo Transporte Total (R$)</Label>
                  <Input
                    id="transport_cost"
                    type="number"
                    step="0.01"
                    value={formData.transport_cost_total}
                    onChange={(e) => handleInputChange('transport_cost_total', e.target.value)}
                    placeholder="25.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financial_cost">Custo Financeiro Total (R$)</Label>
                  <Input
                    id="financial_cost"
                    type="number"
                    step="0.01"
                    value={formData.financial_cost_total}
                    onChange={(e) => handleInputChange('financial_cost_total', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depreciation_cost">Depreciação Total (R$)</Label>
                  <Input
                    id="depreciation_cost"
                    type="number"
                    step="0.01"
                    value={formData.depreciation_total}
                    onChange={(e) => handleInputChange('depreciation_total', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overhead_cost">Overhead Total (R$)</Label>
                  <Input
                    id="overhead_cost"
                    type="number"
                    step="0.01"
                    value={formData.overhead_total}
                    onChange={(e) => handleInputChange('overhead_total', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações sobre a simulação..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="flex-1"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {isCalculating ? 'Calculando...' : 'Calcular Simulação'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {result && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Margem Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${result.margin_total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(result.margin_total)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Spread (R$/@)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${result.spread_r_per_at >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(result.spread_r_per_at)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Break-even (R$/@)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(result.break_even_r_per_at)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${result.roi_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(result.roi_pct)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance do Animal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso de Saída:</span>
                      <span className="font-medium">{formatWeight(result.exit_weight_kg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso Carcaça:</span>
                      <span className="font-medium">{formatWeight(result.carcass_weight_kg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Arrobas Gancho:</span>
                      <span className="font-medium">{formatArroubas(result.arroubas_hook)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Arrobas Ganho:</span>
                      <span className="font-medium">{formatArroubas(result.arroubas_gain)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Breakdown de Custos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo Compra:</span>
                      <span className="font-medium">{formatCurrency(result.purchase_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo Alimentação:</span>
                      <span className="font-medium">{formatCurrency(result.feed_cost_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custos Fixos:</span>
                      <span className="font-medium">{formatCurrency(result.fixed_admin_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo Mortalidade:</span>
                      <span className="font-medium">{formatCurrency(result.mortality_cost)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Custo Total:</span>
                      <span>{formatCurrency(result.total_cost)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Receita:</span>
                      <span>{formatCurrency(result.revenue)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Simulação'}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}