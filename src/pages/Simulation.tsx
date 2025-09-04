import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, ArrowLeft, ArrowRight, Settings, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatWeight, formatArroubas, formatPercentage } from '@/services/calculations';
import type { SimulationInput } from '@/services/calculations';
import { useSimCalculator } from '@/hooks/useSimCalculator';
import { 
  findMatrixRow, 
  fetchUnits, 
  fetchDietasForUnit, 
  fetchAnimalTypesForSelection, 
  fetchModalidadesForSelection,
  type MatrixSuggestions, 
  type UnitMatrixRow 
} from '@/services/unitMatrix';
import { UnitPremisesModal } from '@/components/UnitPremisesModal';
import { HistoricalHint } from '@/components/HistoricalHint';
import { SaveOrchestrator } from '@/services/saveOrchestrator';
import { businessDataSchema, simulationFormSchema } from '@/schemas/simulationSchema';
import { DrePecuarista } from '@/components/DrePecuarista';
import { DreBoitel } from '@/components/DreBoitel';
import { ScenariosManager, type Scenario } from '@/components/ScenariosManager';

export default function Simulation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('animal');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [premises, setPremises] = useState<any>(null);
  
  // Scenarios Management
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-1');
  
  // Unit Matrix Integration
  const [units, setUnits] = useState<Array<{ code: string; name: string; state: string }>>([]);
  const [dietas, setDietas] = useState<string[]>([]);
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [matrixSuggestions, setMatrixSuggestions] = useState<MatrixSuggestions | null>(null);
  const [showPremisesModal, setShowPremisesModal] = useState(false);
  
  // Profile data for originator selection
  const [profiles, setProfiles] = useState<Array<{ id: string; first_name?: string; last_name?: string }>>([]);
  
  // Historical medians for hints
  const [historicalHints, setHistoricalHints] = useState<{[key: string]: { unit_median?: number; originator_median?: number }}>({});

  // Initialize default scenario on mount
  useEffect(() => {
    if (scenarios.length === 0) {
      const defaultScenario: Scenario = {
        id: 'scenario-1',
        name: 'Cenário Base',
        isActive: true,
        formData: {
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
          financial_cost_total: 15,
          depreciation_total: 8,
          overhead_total: 12,
          
          // Constants
          use_average_weight: true,
        },
        businessData: {
          // Identification
          pecuarista: '',
          originator_id: user?.id || '',
          negotiation_date: new Date(),
          unit_code: '',
          dieta: '',
          scale_type: 'Fazenda' as 'Fazenda' | 'Balanção' | 'Balancinha',
          breakage_farm_pct: 2.0,
          breakage_scale_pct: 1.0,
          modalidade: '' as 'Diária' | 'Arroba Prod.' | '',
          
          // Lot & Weights
          qtd_animais: 100,
          tipo_animal: '',
          peso_fazenda_kg: 0,
          peso_entrada_balancao_kg: 0,
          peso_ajustado_balancinha_kg: 0,
          
          // Market
          lean_cattle_yield_at: 0.50,
          price_lean_r_per_at: 300,
          price_fat_r_per_at: 350,
          agio_r: 0,
        }
      };
      setScenarios([defaultScenario]);
    }
  }, [user?.id]);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const [formData, setFormData] = useState<Partial<SimulationInput> & { title: string; notes?: string }>(
    activeScenario?.formData || {
      title: '',
      entry_weight_kg: 300,
      days_on_feed: 120,
      adg_kg_day: 1.4,
      dmi_pct_bw: 2.5,
      mortality_pct: 2.0,
      feed_waste_pct: 5.0,
      selling_price_per_at: 350,
      feed_cost_kg_dm: 0.45,
      health_cost_total: 45,
      transport_cost_total: 25,
      financial_cost_total: 15,
      depreciation_total: 8,
      overhead_total: 12,
      use_average_weight: true,
    }
  );

  const [businessData, setBusinessData] = useState(
    activeScenario?.businessData || {
      pecuarista: '',
      originator_id: user?.id || '',
      negotiation_date: new Date(),
      unit_code: '',
      dieta: '',
      scale_type: 'Fazenda' as 'Fazenda' | 'Balanção' | 'Balancinha',
      breakage_farm_pct: 2.0,
      breakage_scale_pct: 1.0,
      modalidade: '' as 'Diária' | 'Arroba Prod.' | '',
      qtd_animais: 100,
      tipo_animal: '',
      peso_fazenda_kg: 0,
      peso_entrada_balancao_kg: 0,
      peso_ajustado_balancinha_kg: 0,
      lean_cattle_yield_at: 0.50,
      price_lean_r_per_at: 300,
      price_fat_r_per_at: 350,
      agio_r: 0,
    }
  );

  // Create complete form data for calculator
  const completeFormData: SimulationInput = {
    ...formData,
    entry_weight_kg: formData.entry_weight_kg || 0,
    days_on_feed: formData.days_on_feed || 0,
    adg_kg_day: formData.adg_kg_day || 0,
    selling_price_per_at: formData.selling_price_per_at || 0,
    feed_cost_kg_dm: formData.feed_cost_kg_dm || 0,
    mortality_pct: formData.mortality_pct || 2.0,
    feed_waste_pct: formData.feed_waste_pct || 5.0,
    health_cost_total: formData.health_cost_total || 0,
    transport_cost_total: formData.transport_cost_total || 0,
    financial_cost_total: formData.financial_cost_total || 0,
    depreciation_total: formData.depreciation_total || 0,
    overhead_total: formData.overhead_total || 0,
    negotiation: {
      modalidade: businessData.modalidade || '',
      service_price: matrixSuggestions?.service_price || 0,
      qtd_animais: businessData.qtd_animais,
      quebra_fazenda_pct: businessData.breakage_farm_pct,
      quebra_balanca_pct: businessData.breakage_scale_pct,
      agio_magro_r: businessData.agio_r,
      rendimento_boi_magro_prod_pct: businessData.lean_cattle_yield_at,
      preco_boi_magro_r_por_arroba: businessData.price_lean_r_per_at,
    }
  };

  // Use the calculation hook
  const { result, isValid, hasMinimumInputs } = useSimCalculator({ 
    input: completeFormData,
    premises
  });

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setSimulationId(editId);
      loadSimulation(editId);
    }
    loadPremises();
    loadUnits();
    loadProfiles();
  }, [searchParams]);

  // Load matrix suggestions when business data changes
  useEffect(() => {
    if (businessData.unit_code && 
        businessData.modalidade && 
        businessData.dieta && 
        businessData.tipo_animal && 
        formData.entry_weight_kg) {
      
      loadMatrixSuggestions();
    }
  }, [businessData.unit_code, businessData.modalidade, businessData.dieta, businessData.tipo_animal, formData.entry_weight_kg]);

  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update current scenario
    setScenarios(prev => prev.map(scenario => 
      scenario.id === activeScenarioId 
        ? { ...scenario, formData: newFormData }
        : scenario
    ));
  };

  const handleBusinessDataChange = (field: string, value: any) => {
    const newBusinessData = { ...businessData, [field]: value };
    setBusinessData(newBusinessData);
    
    // Update current scenario
    setScenarios(prev => prev.map(scenario => 
      scenario.id === activeScenarioId 
        ? { ...scenario, businessData: newBusinessData }
        : scenario
    ));
  };

  // Scenarios Management Functions
  const handleScenarioChange = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setFormData(scenario.formData);
      setBusinessData(scenario.businessData);
    }
  };

  const handleAddScenario = () => {
    const newScenarioId = `scenario-${Date.now()}`;
    const newScenario: Scenario = {
      id: newScenarioId,
      name: `Cenário ${scenarios.length + 1}`,
      isActive: false,
      formData: { ...formData },
      businessData: { ...businessData }
    };
    
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioId(newScenarioId);
  };

  const handleDuplicateScenario = (scenarioId: string) => {
    const sourceScenario = scenarios.find(s => s.id === scenarioId);
    if (sourceScenario) {
      const newScenarioId = `scenario-${Date.now()}`;
      const newScenario: Scenario = {
        id: newScenarioId,
        name: `${sourceScenario.name} (Cópia)`,
        isActive: false,
        formData: { ...sourceScenario.formData },
        businessData: { ...sourceScenario.businessData }
      };
      
      setScenarios(prev => [...prev, newScenario]);
      setActiveScenarioId(newScenarioId);
      setFormData(newScenario.formData);
      setBusinessData(newScenario.businessData);
    }
  };

  const handleRenameScenario = (scenarioId: string, newName: string) => {
    setScenarios(prev => prev.map(scenario => 
      scenario.id === scenarioId 
        ? { ...scenario, name: newName }
        : scenario
    ));
  };

  const handleDeleteScenario = (scenarioId: string) => {
    if (scenarios.length <= 1) return;
    
    const newScenarios = scenarios.filter(s => s.id !== scenarioId);
    setScenarios(newScenarios);
    
    if (scenarioId === activeScenarioId) {
      const firstScenario = newScenarios[0];
      setActiveScenarioId(firstScenario.id);
      setFormData(firstScenario.formData);
      setBusinessData(firstScenario.businessData);
    }
  };

  // Load functions
  const loadPremises = async () => {
    try {
      const { data, error } = await supabase
        .from('premises')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn('No premises found:', error);
        return;
      }
      
      setPremises(data);
    } catch (error) {
      console.error('Error loading premises:', error);
    }
  };

  const loadUnits = async () => {
    try {
      const unitsData = await fetchUnits();
      setUnits(unitsData);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadMatrixSuggestions = async () => {
    try {
      const suggestions = await findMatrixRow({
        unit_code: businessData.unit_code,
        modalidade: businessData.modalidade,
        dieta: businessData.dieta,
        tipo_animal: businessData.tipo_animal,
        entry_weight_kg: formData.entry_weight_kg || 0
      });
      
      setMatrixSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading matrix suggestions:', error);
    }
  };

  const loadSimulation = async (id: string) => {
    try {
      // Load simulation data
      const { data: simData, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', id)
        .single();

      if (simError) throw simError;

      if (simData) {
        setFormData({
          title: simData.title,
          entry_weight_kg: simData.entry_weight_kg,
          days_on_feed: simData.days_on_feed,
          adg_kg_day: simData.adg_kg_day,
          dmi_pct_bw: simData.dmi_pct_bw,
          selling_price_per_at: simData.selling_price_per_at,
          feed_cost_kg_dm: simData.feed_cost_kg_dm,
          mortality_pct: simData.mortality_pct,
          feed_waste_pct: simData.feed_waste_pct,
          health_cost_total: simData.health_cost_total,
          transport_cost_total: simData.transport_cost_total,
          financial_cost_total: simData.financial_cost_total,
          depreciation_total: simData.depreciation_total,
          overhead_total: simData.overhead_total,
          purchase_price_per_at: simData.purchase_price_per_at,
          purchase_price_per_kg: simData.purchase_price_per_kg,
          notes: simData.notes,
        });
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
      toast({
        title: "Erro ao carregar simulação",
        description: "Não foi possível carregar os dados da simulação.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Usuário não autenticado",
        description: "Faça login para salvar a simulação.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const orchestrator = new SaveOrchestrator();
      const activeScenario = scenarios.find(s => s.id === activeScenarioId);
      
      if (!activeScenario) {
        throw new Error('Nenhum cenário ativo encontrado');
      }

      const completeFormData = {
        ...activeScenario.formData,
        entry_weight_kg: activeScenario.formData.entry_weight_kg || 0,
        days_on_feed: activeScenario.formData.days_on_feed || 0,
        adg_kg_day: activeScenario.formData.adg_kg_day || 0,
        mortality_pct: activeScenario.formData.mortality_pct || 2.0,
        feed_waste_pct: activeScenario.formData.feed_waste_pct || 5.0,
        selling_price_per_at: activeScenario.formData.selling_price_per_at || 0,
        feed_cost_kg_dm: activeScenario.formData.feed_cost_kg_dm || 0,
        health_cost_total: activeScenario.formData.health_cost_total || 0,
        transport_cost_total: activeScenario.formData.transport_cost_total || 0,
        financial_cost_total: activeScenario.formData.financial_cost_total || 0,
        depreciation_total: activeScenario.formData.depreciation_total || 0,
        overhead_total: activeScenario.formData.overhead_total || 0,
      };

      await orchestrator.saveSimulation(
        activeScenario.businessData,
        completeFormData,
        premises,
        isEditing,
        simulationId || undefined
      );

      toast({
        title: "Simulação salva com sucesso!",
        description: "A simulação foi salva e está disponível na lista.",
      });

      navigate('/simulations');
    } catch (error) {
      console.error('Error saving simulation:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro inesperado ao salvar a simulação.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? 'Editar Simulação' : 'Nova Simulação'}
          </h1>
          <p className="text-muted-foreground">
            Configure os parâmetros e analise os resultados financeiros do confinamento
          </p>
        </div>
        <div className="flex gap-2">
          {result && isValid && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Margem Total</div>
              <div className={`text-lg font-bold ${result.margin_total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(result.margin_total)}
              </div>
            </div>
          )}
          <Button 
            onClick={handleSave}
            disabled={!isValid || !hasMinimumInputs || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Calculator className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Atualizar' : 'Salvar'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Scenarios Sidebar */}
        <div className="xl:col-span-1">
          <ScenariosManager
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onScenarioChange={handleScenarioChange}
            onAddScenario={handleAddScenario}
            onDuplicateScenario={handleDuplicateScenario}
            onRenameScenario={handleRenameScenario}
            onDeleteScenario={handleDeleteScenario}
          />
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="animal">Animal & Performance</TabsTrigger>
              <TabsTrigger value="costs">Preços & Custos</TabsTrigger>
              <TabsTrigger value="review">Revisão & Salvar</TabsTrigger>
            </TabsList>

            <TabsContent value="animal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700 dark:text-blue-400">Dados do Negócio</CardTitle>
                  <CardDescription>
                    Complete as informações do negócio, unidade e parâmetros operacionais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Identification */}
                  <div>
                    <h4 className="font-medium mb-3 text-blue-600">Identificação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pecuarista">Pecuarista</Label>
                        <Input
                          id="pecuarista"
                          value={businessData.pecuarista}
                          onChange={(e) => handleBusinessDataChange('pecuarista', e.target.value)}
                          placeholder="Nome do Pecuarista"
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="originator">Originador</Label>
                        <Select 
                          value={businessData.originator_id} 
                          onValueChange={(value) => handleBusinessDataChange('originator_id', value)}
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
                        <Label htmlFor="nego_date">Data Negociação</Label>
                        <Input
                          id="nego_date"
                          type="date"
                          value={businessData.negotiation_date.toISOString().split('T')[0]}
                          onChange={(e) => handleBusinessDataChange('negotiation_date', new Date(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Parameters */}
                  <div>
                    <h4 className="font-medium mb-3 text-blue-600">Parâmetros do Serviço</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unidade</Label>
                        <Select 
                          value={businessData.unit_code} 
                          onValueChange={async (value) => {
                            handleBusinessDataChange('unit_code', value);
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
                          value={businessData.dieta} 
                          onValueChange={(value) => handleBusinessDataChange('dieta', value)}
                          disabled={!businessData.unit_code}
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
                          value={businessData.scale_type} 
                          onValueChange={(value) => handleBusinessDataChange('scale_type', value)}
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
                          value={businessData.modalidade} 
                          onValueChange={async (value) => {
                            handleBusinessDataChange('modalidade', value);
                          }}
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
                        <Label htmlFor="breakage_farm">Quebra Fazenda→Confinamento (%)</Label>
                        <Input
                          id="breakage_farm"
                          type="number"
                          step="0.1"
                          value={businessData.breakage_farm_pct}
                          onChange={(e) => handleBusinessDataChange('breakage_farm_pct', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="breakage_scale">Quebra Escala (%)</Label>
                        <Input
                          id="breakage_scale"
                          type="number"
                          step="0.1"
                          value={businessData.breakage_scale_pct}
                          onChange={(e) => handleBusinessDataChange('breakage_scale_pct', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lot & Weights */}
                  <div>
                    <h4 className="font-medium mb-3 text-blue-600">Lote & Pesos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="qty_animals">Qtd Cabeças</Label>
                        <Input
                          id="qty_animals"
                          type="number"
                          value={businessData.qtd_animais}
                          onChange={(e) => handleBusinessDataChange('qtd_animais', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="animal_type">Tipo Animal</Label>
                        <Select 
                          value={businessData.tipo_animal} 
                          onValueChange={(value) => handleBusinessDataChange('tipo_animal', value)}
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
                          value={businessData.peso_fazenda_kg}
                          onChange={(e) => handleBusinessDataChange('peso_fazenda_kg', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="peso_balancao">Peso Entrada - Balanção (kg)</Label>
                        <Input
                          id="peso_balancao"
                          type="number"
                          step="0.1"
                          value={businessData.peso_entrada_balancao_kg}
                          onChange={(e) => handleBusinessDataChange('peso_entrada_balancao_kg', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="peso_balancinha">Peso Ajustado - Balancinha (kg)</Label>
                        <Input
                          id="peso_balancinha"
                          type="number"
                          step="0.1"
                          value={businessData.peso_ajustado_balancinha_kg}
                          onChange={(e) => handleBusinessDataChange('peso_ajustado_balancinha_kg', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Zootechnical */}
                  <div>
                    <h4 className="font-medium mb-3 text-blue-600">Zootécnico</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="days_feed">Dias no Cocho</Label>
                        <Input
                          id="days_feed"
                          type="number"
                          value={formData.days_on_feed}
                          onChange={(e) => handleInputChange('days_on_feed', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                        <HistoricalHint 
                          fieldName="days_on_feed" 
                          hints={historicalHints.days_on_feed || {}}
                          formatter={(v) => `${v} dias`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adg">GMD (kg/d)</Label>
                        <Input
                          id="adg"
                          type="number"
                          step="0.1"
                          value={formData.adg_kg_day}
                          onChange={(e) => handleInputChange('adg_kg_day', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                        <HistoricalHint 
                          fieldName="adg_kg_day" 
                          hints={historicalHints.adg_kg_day || {}}
                          formatter={(v) => `${v} kg/d`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rc">RC (% carcaça)</Label>
                        <Input
                          id="rc"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={premises?.carcass_yield_pct ? premises.carcass_yield_pct * 100 : 53}
                          disabled
                          className="bg-gray-100 border-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dmi">DMI (kg/d)</Label>
                        <Input
                          id="dmi"
                          type="number"
                          step="0.1"
                          value={formData.dmi_kg_day || ''}
                          onChange={(e) => handleInputChange('dmi_kg_day', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="feed_cost">Custo Ração (R$/kg MS)</Label>
                        <Input
                          id="feed_cost"
                          type="number"
                          step="0.01"
                          value={formData.feed_cost_kg_dm || ''}
                          onChange={(e) => handleInputChange('feed_cost_kg_dm', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                        <HistoricalHint 
                          fieldName="feed_cost_kg_dm" 
                          hints={historicalHints.feed_cost_kg_dm || {}}
                          formatter={(v) => formatCurrency(v) + '/kg'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Market */}
                  <div>
                    <h4 className="font-medium mb-3 text-blue-600">Mercado</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lean_yield">Rendimento Boi Magro (@ Prod.)</Label>
                        <Input
                          id="lean_yield"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={businessData.lean_cattle_yield_at}
                          onChange={(e) => handleBusinessDataChange('lean_cattle_yield_at', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price_lean">Preço @ Boi Magro</Label>
                        <Input
                          id="price_lean"
                          type="number"
                          step="0.01"
                          value={businessData.price_lean_r_per_at}
                          onChange={(e) => handleBusinessDataChange('price_lean_r_per_at', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                        <HistoricalHint 
                          fieldName="price_lean" 
                          hints={historicalHints.price_lean || {}}
                          formatter={formatCurrency}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price_fat">Preço @ Boi Gordo</Label>
                        <Input
                          id="price_fat"
                          type="number"
                          step="0.01"
                          value={businessData.price_fat_r_per_at}
                          onChange={(e) => handleBusinessDataChange('price_fat_r_per_at', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                        <HistoricalHint 
                          fieldName="price_fat" 
                          hints={historicalHints.price_fat || {}}
                          formatter={formatCurrency}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agio">Ágio (R$)</Label>
                        <Input
                          id="agio"
                          type="number"
                          step="0.01"
                          value={businessData.agio_r}
                          onChange={(e) => handleBusinessDataChange('agio_r', Number(e.target.value))}
                          className="bg-blue-50 border-blue-200"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Service Price Display */}
                  {matrixSuggestions && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-blue-700 dark:text-blue-300">Preço de Serviço & Etiqueta do Produto</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPremisesModal(true)}
                          className="ml-auto border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Ver Premissas da Unidade
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-sm text-blue-600 dark:text-blue-400">Preço Base:</span>
                          <span className="font-bold ml-2 text-blue-700 dark:text-blue-300">
                            {formatCurrency(matrixSuggestions.service_price_base || 0)}
                            {businessData.modalidade === 'Diária' ? '/cab/dia' : '/@'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-blue-600 dark:text-blue-400">Preço Final:</span>
                          <span className="font-bold ml-2 text-lg text-blue-800 dark:text-blue-200">
                            {formatCurrency(matrixSuggestions.service_price || 0)}
                            {businessData.modalidade === 'Diária' ? '/cab/dia' : '/@'}
                          </span>
                        </div>
                        {matrixSuggestions.concat_label && (
                          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-300">
                            <Tag className="w-3 h-3" />
                            {matrixSuggestions.concat_label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live DRE Preview */}
                  {result && (
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <DrePecuarista 
                        data={{
                          arroubas_hook: result.arroubas_hook,
                          arroubas_magro: result.arroubas_magro || (formData.entry_weight_kg || 0) / 15,
                          arroubas_gain: result.arroubas_gain,
                          days_on_feed: formData.days_on_feed || 0,
                          qtd_animais: businessData.qtd_animais,
                          price_fat_r_per_at: businessData.price_fat_r_per_at,
                          price_lean_r_per_at: businessData.price_lean_r_per_at,
                          agio_r: businessData.agio_r,
                          service_price: matrixSuggestions?.service_price || 0,
                          modalidade: businessData.modalidade || 'Diária',
                          taxa_abate: 0,
                          frete_pecuarista: 0,
                          result_per_head: result.margin_total,
                          result_total: result.margin_total,
                          cost_per_at_produced: result.cost_per_arrouba,
                          result_per_at_bm: result.result_per_at_bm || 0,
                          monthly_return_pct: result.monthly_return_pct || 0,
                        }}
                      />
                      <DreBoitel 
                        data={{
                          service_price: matrixSuggestions?.service_price || 0,
                          modalidade: businessData.modalidade || 'Diária',
                          arroubas_gain: result.arroubas_gain,
                          days_on_feed: formData.days_on_feed || 0,
                          qtd_animais: businessData.qtd_animais,
                          feed_cost_total: result.feed_cost_total,
                          freight_confinement: result.freight_confinement,
                          sanitary_mortality: result.sanitary_mortality,
                          ctr_cost: result.ctr_cost,
                          cf_cost: result.cf_cost,
                          corp_cost: result.corp_cost,
                          depreciation_cost: result.depreciation_cost,
                          financial_cost: result.financial_cost,
                          other_fixed: result.other_fixed,
                          result_jbs_per_head: result.result_jbs_per_head,
                          result_jbs_total: result.result_jbs_total,
                          result_per_arroba: result.result_per_arroba,
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dados do Animal e Performance</CardTitle>
                  <CardDescription>
                    Configure o peso inicial, ganho de peso e consumo dos animais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="title">Título da Simulação *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Ex: Boi 300kg - 120 dias"
                        required
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
                        required
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
                        required
                      />
                      <p className="text-xs text-muted-foreground">Recomendado: 90-180 dias</p>
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
                        required
                      />
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">Típico: 1.0-1.8 kg/dia</p>
                        <p className="text-blue-600">Mediana Unidade (12m): 1.6 kg/dia</p>
                        <p className="text-green-600">Mediana Originador (12m): 1.5 kg/dia</p>
                      </div>
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
                      <p className="text-xs text-muted-foreground">Típico: 2.2-2.8% do peso vivo</p>
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
                      <p className="text-xs text-muted-foreground">Aceitável: 0.5-3%</p>
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
                      <p className="text-xs text-muted-foreground">Típico: 2-8%</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Método de Cálculo do Consumo</Label>
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      <Switch
                        id="use_average_weight"
                        checked={formData.use_average_weight}
                        onCheckedChange={(checked) => handleInputChange('use_average_weight', checked)}
                      />
                      <Label htmlFor="use_average_weight" className="text-sm">
                        Usar peso médio para calcular DMI (recomendado)
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Peso médio = (peso entrada + peso saída) / 2. Método mais preciso para consumo diário.
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button onClick={() => setActiveTab('costs')} disabled={!hasMinimumInputs}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Próximo: Preços & Custos
                    </Button>
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
                      <p className="text-xs text-muted-foreground">Preço por arroba (15kg)</p>
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
                      <p className="text-xs text-muted-foreground">Alternativo ao preço por @</p>
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
                        required
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
                        required
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
                        placeholder="15.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="depreciation">Depreciação Total (R$)</Label>
                      <Input
                        id="depreciation"
                        type="number"
                        step="0.01"
                        value={formData.depreciation_total}
                        onChange={(e) => handleInputChange('depreciation_total', e.target.value)}
                        placeholder="8.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overhead">Overhead Total (R$)</Label>
                      <Input
                        id="overhead"
                        type="number"
                        step="0.01"
                        value={formData.overhead_total}
                        onChange={(e) => handleInputChange('overhead_total', e.target.value)}
                        placeholder="12.00"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('animal')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar: Animal
                    </Button>
                    <Button onClick={() => setActiveTab('review')} disabled={!hasMinimumInputs}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Próximo: Revisão
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-6">
              {result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Resultados da Simulação
                    </CardTitle>
                    <CardDescription>
                      Resumo dos principais indicadores financeiros e zootécnicos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-blue-600 mb-1">Margem Total</div>
                        <div className={`text-xl font-bold ${result.margin_total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(result.margin_total)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-green-600 mb-1">Spread</div>
                        <div className="text-xl font-bold text-green-700">
                          {formatCurrency(result.spread_r_per_at)}/＠
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-orange-600 mb-1">Break-even</div>
                        <div className="text-xl font-bold text-orange-700">
                          {formatCurrency(result.break_even_r_per_at)}/＠
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-purple-600 mb-1">ROI</div>
                        <div className="text-xl font-bold text-purple-700">
                          {formatPercentage(result.roi_pct)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                        <div className="text-sm font-medium text-indigo-600 mb-1">@ Ganho</div>
                        <div className="text-xl font-bold text-indigo-700">
                          {formatArroubas(result.arroubas_gain)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Peso Entrada:</span>
                          <div className="font-semibold">{formatWeight(formData.entry_weight_kg || 0)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Peso Saída:</span>
                          <div className="font-semibold">{formatWeight(result.exit_weight_kg)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">@ Gancho:</span>
                          <div className="font-semibold">{formatArroubas(result.arroubas_hook)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dias Cocho:</span>
                          <div className="font-semibold">{formData.days_on_feed} dias</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="notes">Observações da Simulação</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes || ''}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Adicione observações sobre a simulação..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={() => setActiveTab('costs')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar: Custos
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={!isValid || !hasMinimumInputs || isSaving}
                        className="min-w-[120px]"
                      >
                        {isSaving ? (
                          <>
                            <Calculator className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {isEditing ? 'Atualizar' : 'Salvar'} Simulação
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {matrixSuggestions?.matched_row && (
        <UnitPremisesModal
          matrixRow={matrixSuggestions.matched_row}
          open={showPremisesModal}
          onClose={() => setShowPremisesModal(false)}
          onApplySuggestion={(field, value) => {
            handleInputChange(field, value);
            setShowPremisesModal(false);
          }}
        />
      )}
    </div>
  );
}