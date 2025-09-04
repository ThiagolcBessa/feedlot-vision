import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/services/calculations';
import { useSimCalculator } from '@/hooks/useSimCalculator';
import { ScenariosManager, Scenario } from '@/components/ScenariosManager';
import { SimulationForm } from '@/components/SimulationForm';
import { TaxasFreteForm } from '@/components/TaxasFreteForm';
import { DrePecuaristaMatrix } from '@/components/DrePecuaristaMatrix';
import { DreBoitelMatrix } from '@/components/DreBoitelMatrix';
import { 
  findMatrixRow, 
  type MatrixSuggestions 
} from '@/services/unitMatrix';
import { calculateMatrixDrivenDRE, type DREPecuaristaData, type DREBoitelData } from '@/services/matrixCalculator';
import { SaveOrchestrator } from '@/services/saveOrchestrator';
import { simulationSchema, type SimulationFormType } from '@/schemas/simulationSchema';

export default function Simulation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dados');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [premises, setPremises] = useState<any>(null);
  
  // Scenarios Management
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-1');
  
  // Matrix integration
  const [matrixSuggestions, setMatrixSuggestions] = useState<MatrixSuggestions | null>(null);
  
  // Profile data for originator selection
  const [profiles, setProfiles] = useState<Array<{ id: string; first_name?: string; last_name?: string }>>([]);
  
  // Historical medians for hints
  const [historicalHints, setHistoricalHints] = useState<{[key: string]: { unit_median?: number; originator_median?: number }}>({});
  
  // User-editable fields (not from matrix)
  const [userEditableFields, setUserEditableFields] = useState({
    frete_confinamento_r: 0,
    frete_pecuarista_r: 0,
    taxa_abate_r: 0,
    icms_devolucao_r: 0,
  });
  
  // DRE calculation results
  const [dreData, setDreData] = useState<{
    pecuarista: DREPecuaristaData;
    boitel: DREBoitelData;
  } | null>(null);

  // Initialize default scenario on mount
  useEffect(() => {
    if (scenarios.length === 0) {
      const defaultFormData: SimulationFormType = {
        title: 'Nova Simulação',
        
        // IDENTIFICAÇÃO - defaults
        pecuarista_name: '',
        originator_id: user?.id || '',
        date_ref: new Date(),
        unit_code: '',
        dieta: '',
        scale_type: 'Balanção',
        modalidade: 'Diária',
        quebra_fazenda_pct: 0.02, // 2% stored as fraction
        quebra_balanca_pct: 0.01, // 1% stored as fraction
        
        // LOTE & PESOS - defaults
        qtd_animais: 100,
        tipo_animal: '',
        peso_fazenda_kg: 0,
        peso_entrada_balancao_kg: 0,
        peso_entrada_balancinha_kg: 0,
        
        // ZOOTÉCNICOS - defaults
        dias_cocho: 120,
        gmd_kg_dia: 1.4,
        rc_pct: 0.53, // 53% stored as fraction
        dmi_kg_dia: 0,
        custo_ms_kg: 0.45,
        
        // MERCADO - defaults
        rendimento_boi_magro_prod_pct: 0.50, // 50% stored as fraction
        preco_boi_magro_r_por_arroba: 165.0,
        preco_boi_gordo_r_por_arroba: 185.0,
        agio_magro_r: 2.5,
        
        notes: '',
      };

      const defaultScenario: Scenario = {
        id: 'scenario-1',
        name: 'Cenário Base',
        isActive: true,
        formData: defaultFormData,
        businessData: {}
      };
      
      setScenarios([defaultScenario]);
    }
  }, [user?.id]);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const formData = activeScenario?.formData || {
    title: 'Nova Simulação',
    pecuarista_name: '',
    originator_id: user?.id || '',
    date_ref: new Date(),
    unit_code: '',
    dieta: '',
    scale_type: 'Balanção' as const,
    modalidade: 'Diária' as const,
    quebra_fazenda_pct: 0.02,
    quebra_balanca_pct: 0.01,
    qtd_animais: 100,
    tipo_animal: '',
    peso_fazenda_kg: 0,
    peso_entrada_balancao_kg: 0,
    peso_entrada_balancinha_kg: 0,
    dias_cocho: 120,
    gmd_kg_dia: 1.4,
    rc_pct: 0.53,
    dmi_kg_dia: 0,
    custo_ms_kg: 0.45,
    rendimento_boi_magro_prod_pct: 0.50,
    preco_boi_magro_r_por_arroba: 165.0,
    preco_boi_gordo_r_por_arroba: 185.0,
    agio_magro_r: 2.5,
    notes: '',
  };

  // Create complete form data for calculator  
  const completeFormData = {
    ...formData,
    entry_weight_kg: formData.peso_fazenda_kg || formData.peso_entrada_balancao_kg || formData.peso_entrada_balancinha_kg || 0,
    days_on_feed: formData.dias_cocho || 0,
    adg_kg_day: formData.gmd_kg_dia || 0,
    selling_price_per_at: formData.preco_boi_gordo_r_por_arroba || 0,
    feed_cost_kg_dm: formData.custo_ms_kg || 0,
    mortality_pct: 2.0,
    feed_waste_pct: 5.0,
    health_cost_total: 0,
    transport_cost_total: 0,
    financial_cost_total: 0,
    depreciation_total: 0,
    overhead_total: 0,
    negotiation: {
      modalidade: formData.modalidade || '',
      service_price: matrixSuggestions?.service_price || 0,
      qtd_animais: formData.qtd_animais || 0,
      quebra_fazenda_pct: formData.quebra_fazenda_pct || 0,
      quebra_balanca_pct: formData.quebra_balanca_pct || 0,
      agio_magro_r: formData.agio_magro_r || 0,
      rendimento_boi_magro_prod_pct: formData.rendimento_boi_magro_prod_pct || 0,
      preco_boi_magro_r_por_arroba: formData.preco_boi_magro_r_por_arroba || 0,
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
    loadProfiles();
  }, [searchParams]);

  // Load matrix suggestions when form data changes
  useEffect(() => {
    if (formData.unit_code && 
        formData.modalidade && 
        formData.dieta && 
        formData.tipo_animal && 
        formData.peso_fazenda_kg) {
      
      loadMatrixSuggestions();
    }
  }, [formData.unit_code, formData.modalidade, formData.dieta, formData.tipo_animal, formData.peso_fazenda_kg]);
  
  // Recalculate DREs when matrix suggestions change
  useEffect(() => {
    if (matrixSuggestions) {
      calculateDREs(formData, matrixSuggestions, userEditableFields);
    }
  }, [matrixSuggestions, formData, userEditableFields]);

  const handleFormDataChange = (newFormData: SimulationFormType) => {
    // Update current scenario
    setScenarios(prev => prev.map(scenario => 
      scenario.id === activeScenarioId 
        ? { ...scenario, formData: newFormData }
        : scenario
    ));
    
    // Recalculate DREs when form data changes
    calculateDREs(newFormData, matrixSuggestions, userEditableFields);
  };

  const handleUserEditableChange = (field: string, value: number) => {
    const newUserFields = { ...userEditableFields, [field]: value };
    setUserEditableFields(newUserFields);
    
    // Recalculate DREs when user editable fields change
    calculateDREs(formData, matrixSuggestions, newUserFields);
  };
  
  // Calculate DREs whenever inputs change
  const calculateDREs = (currentFormData: SimulationFormType, currentMatrixSuggestions: MatrixSuggestions | null, currentUserFields: any) => {
    if (!currentMatrixSuggestions || !currentFormData.qtd_animais || !currentFormData.preco_boi_gordo_r_por_arroba) {
      setDreData(null);
      return;
    }
    
    try {
      const calculationInputs = {
        formData: currentFormData,
        matrixSuggestions: currentMatrixSuggestions,
        preco_boi_magro_r_por_arroba: currentFormData.preco_boi_magro_r_por_arroba || 0,
        preco_boi_gordo_r_por_arroba: currentFormData.preco_boi_gordo_r_por_arroba || 0,
        agio_magro_r: currentFormData.agio_magro_r || 0,
        frete_confinamento_r: currentUserFields.frete_confinamento_r || 0,
        frete_pecuarista_r: currentUserFields.frete_pecuarista_r || 0,
        taxa_abate_r: currentUserFields.taxa_abate_r || 0,
        icms_devolucao_r: currentUserFields.icms_devolucao_r || 0,
      };
      
      const result = calculateMatrixDrivenDRE(calculationInputs);
      setDreData(result);
    } catch (error) {
      console.error('Error calculating DREs:', error);
      setDreData(null);
    }
  };

  // Scenarios Management Functions
  const handleScenarioChange = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
  };

  const handleAddScenario = () => {
    const newScenarioId = `scenario-${Date.now()}`;
    const newScenario: Scenario = {
      id: newScenarioId,
      name: `Cenário ${scenarios.length + 1}`,
      isActive: false,
      formData: { ...formData },
      businessData: {}
    };
    
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioId(newScenarioId);
  };

  const handleDuplicateScenario = (scenarioId: string) => {
    const sourceScenario = scenarios.find(s => s.id === scenarioId);
    if (sourceScenario?.formData) {
      const newScenarioId = `scenario-${Date.now()}`;
      const newScenario: Scenario = {
        id: newScenarioId,
        name: `${sourceScenario.name} (Cópia)`,
        isActive: false,
        formData: { ...sourceScenario.formData },
        businessData: {}
      };
      
      setScenarios(prev => [...prev, newScenario]);
      setActiveScenarioId(newScenarioId);
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
    if (!formData.unit_code || !formData.modalidade || !formData.dieta || !formData.tipo_animal || !formData.peso_fazenda_kg) {
      return;
    }

    try {
      const suggestions = await findMatrixRow({
        unit_code: formData.unit_code,
        modalidade: formData.modalidade,
        dieta: formData.dieta,
        tipo_animal: formData.tipo_animal,
        entry_weight_kg: formData.peso_fazenda_kg
      });
      
      setMatrixSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading matrix suggestions:', error);
    }
  };

  const loadSimulation = async (id: string) => {
    try {
      // Load simulation data - would need to convert back from old format
      const { data: simData, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', id)
        .single();

      if (simError) throw simError;

      if (simData) {
        // Convert old format to new unified format
        const convertedFormData: SimulationFormType = {
          title: simData.title,
          pecuarista_name: '',
          originator_id: user?.id || '',
          date_ref: new Date(),
          unit_code: '',
          dieta: '',
          scale_type: 'Balanção',
          modalidade: 'Diária',
          quebra_fazenda_pct: 0.02,
          quebra_balanca_pct: 0.01,
          qtd_animais: 100,
          tipo_animal: '',
          peso_fazenda_kg: simData.entry_weight_kg,
          peso_entrada_balancao_kg: 0,
          peso_entrada_balancinha_kg: 0,
          dias_cocho: simData.days_on_feed,
          gmd_kg_dia: simData.adg_kg_day,
          rc_pct: 0.53,
          dmi_kg_dia: simData.dmi_kg_day,
          custo_ms_kg: simData.feed_cost_kg_dm,
          rendimento_boi_magro_prod_pct: 0.50,
          preco_boi_magro_r_por_arroba: simData.purchase_price_per_at || 0,
          preco_boi_gordo_r_por_arroba: simData.selling_price_per_at,
          agio_magro_r: 0,
          notes: simData.notes,
        };

        setScenarios([{
          id: 'scenario-1',
          name: 'Cenário Carregado',
          isActive: true,
          formData: convertedFormData,
          businessData: {}
        }]);
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
      
      if (!formData) {
        throw new Error('Nenhum cenário ativo encontrado');
      }

      const result = await orchestrator.saveSimulation(
        formData,
        premises,
        isEditing,
        simulationId || undefined
      );

      if (result.success) {
        toast({
          title: "Simulação salva com sucesso!",
          description: `${isEditing ? 'Simulação atualizada' : 'Nova simulação criada'} e disponível na lista.`,
        });
        navigate('/simulations');
      } else {
        toast({
          title: "Erro ao salvar simulação",
          description: result.error || "Erro inesperado durante o salvamento. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      toast({
        title: "Erro inesperado",
        description: "Falha na comunicação com o servidor. Verifique sua conexão e tente novamente.",
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
              <TabsTrigger value="dados">Dados do Negócio</TabsTrigger>
              <TabsTrigger value="resultados">Resultados</TabsTrigger>
              <TabsTrigger value="revisao">Revisão & Salvar</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-6">
              <SimulationForm
                data={formData}
                onChange={handleFormDataChange}
                profiles={profiles.map(p => ({ 
                  id: p.id, 
                  first_name: p.first_name || '', 
                  last_name: p.last_name || '' 
                }))}
                matrixSuggestions={matrixSuggestions}
                onMatrixLookup={loadMatrixSuggestions}
                historicalHints={historicalHints}
              />
              
              {/* Taxas & Fretes - User editable */}
              <TaxasFreteForm
                frete_confinamento_r={userEditableFields.frete_confinamento_r}
                frete_pecuarista_r={userEditableFields.frete_pecuarista_r}
                taxa_abate_r={userEditableFields.taxa_abate_r}
                icms_devolucao_r={userEditableFields.icms_devolucao_r}
                onChange={handleUserEditableChange}
              />
            </TabsContent>

            <TabsContent value="resultados" className="space-y-6">
              {matrixSuggestions && dreData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DrePecuaristaMatrix 
                    data={dreData.pecuarista} 
                    qtdAnimais={formData.qtd_animais || 0}
                  />
                  <DreBoitelMatrix 
                    data={dreData.boitel} 
                    qtdAnimais={formData.qtd_animais || 0}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Complete os dados do negócio para visualizar os DREs
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="revisao" className="space-y-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-4">Revisão Final</h3>
                <p className="text-muted-foreground mb-6">
                  Revise todos os dados antes de salvar a simulação
                </p>
                <Button 
                  onClick={handleSave}
                  disabled={!isValid || !hasMinimumInputs || isSaving}
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Calculator className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Atualizar Simulação' : 'Salvar Simulação'}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}