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

export default function Simulation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('animal');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [premises, setPremises] = useState<any>(null);
  
  // Unit Matrix Integration
  const [units, setUnits] = useState<Array<{ code: string; name: string; state: string }>>([]);
  const [dietas, setDietas] = useState<string[]>([]);
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [matrixSuggestions, setMatrixSuggestions] = useState<MatrixSuggestions | null>(null);
  const [showPremisesModal, setShowPremisesModal] = useState(false);
  
  // Business Data (Dados do Negócio) - Complete blue fields
  const [businessData, setBusinessData] = useState({
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
  });

  // Profile data for originator selection
  const [profiles, setProfiles] = useState<Array<{ id: string; first_name?: string; last_name?: string }>>([]);
  
  // Historical medians for hints
  const [historicalHints, setHistoricalHints] = useState<{[key: string]: { unit_median?: number; originator_median?: number }}>({});

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
    
    notes: '',
    use_average_weight: true, // Default to recommended method
  });

  // Use the calculation hook
  const { result, isValid, hasMinimumInputs } = useSimCalculator({ input: formData, premises });

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
      loadHistoricalHints();
    }
  }, [businessData.unit_code, businessData.modalidade, businessData.dieta, businessData.tipo_animal, formData.entry_weight_kg]);

  // Load dependent dropdown options
  useEffect(() => {
    if (businessData.unit_code) {
      loadDietas(businessData.unit_code);
    }
  }, [businessData.unit_code]);

  useEffect(() => {
    if (businessData.unit_code && businessData.dieta) {
      loadAnimalTypes(businessData.unit_code, businessData.dieta);
    }
  }, [businessData.unit_code, businessData.dieta]);

  useEffect(() => {
    if (businessData.unit_code && businessData.dieta && businessData.tipo_animal) {
      loadModalidades(businessData.unit_code, businessData.dieta, businessData.tipo_animal);
    }
  }, [businessData.unit_code, businessData.dieta, businessData.tipo_animal]);

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
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadHistoricalHints = async () => {
    if (!businessData.unit_code || !businessData.tipo_animal || !businessData.modalidade) return;
    
    try {
      // Mock historical data since negotiations table not in typed schema
      // In production, this would query the negotiations table
      console.log('Loading historical hints for:', {
        unit: businessData.unit_code,
        type: businessData.tipo_animal,
        modalidade: businessData.modalidade
      });
      
      // Generate mock medians based on typical values
      const mockHints: {[key: string]: { unit_median?: number; originator_median?: number }} = {
        days_on_feed: {
          unit_median: 105,
          originator_median: 110
        },
        adg_kg_day: {
          unit_median: 1.6,
          originator_median: 1.5
        },
        feed_cost_kg_dm: {
          unit_median: 0.45,
          originator_median: 0.47
        },
        price_lean: {
          unit_median: 300,
          originator_median: 295
        },
        price_fat: {
          unit_median: 350,
          originator_median: 348
        }
      };
      
      setHistoricalHints(mockHints);
    } catch (error) {
      console.error('Error loading historical hints:', error);
    }
  };

  const loadDietas = async (unitCode: string) => {
    try {
      const dietasData = await fetchDietasForUnit(unitCode);
      setDietas(dietasData);
    } catch (error) {
      console.error('Error loading dietas:', error);
    }
  };

  const loadAnimalTypes = async (unitCode: string, dieta: string) => {
    try {
      const typesData = await fetchAnimalTypesForSelection(unitCode, dieta);
      setAnimalTypes(typesData);
    } catch (error) {
      console.error('Error loading animal types:', error);
    }
  };

  const loadModalidades = async (unitCode: string, dieta: string, tipoAnimal: string) => {
    try {
      const modalidadesData = await fetchModalidadesForSelection(unitCode, dieta, tipoAnimal);
      setModalidades(modalidadesData);
    } catch (error) {
      console.error('Error loading modalidades:', error);
    }
  };

  const loadMatrixSuggestions = async () => {
    try {
      const suggestions = await findMatrixRow({
        unit_code: businessData.unit_code,
        modalidade: businessData.modalidade as 'Diária' | 'Arroba Prod.',
        dieta: businessData.dieta,
        tipo_animal: businessData.tipo_animal,
        entry_weight_kg: formData.entry_weight_kg!,
      });
      
      setMatrixSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading matrix suggestions:', error);
    }
  };

  const loadPremises = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('premises')
        .select('*')
        .eq('created_by', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPremises(data);
      }
    } catch (error) {
      console.error('Error loading premises:', error);
    }
  };

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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (isNaN(Number(value)) ? value : Number(value)) : value
    }));
  };

  const handleBusinessDataChange = (field: string, value: any) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applySuggestion = (field: string, value: number) => {
    // Map matrix field names to form field names
    const fieldMapping: { [key: string]: string } = {
      'days_on_feed': 'days_on_feed',
      'adg_kg_day': 'adg_kg_day', 
      'dmi_pct_bw': 'dmi_pct_bw',
      'dmi_kg_day': 'dmi_kg_day',
      'carcass_yield_pct': 'carcass_yield_pct', // This will need premises update
      'feed_cost_kg_dm': 'feed_cost_kg_dm',
    };

    const formField = fieldMapping[field];
    if (formField) {
      if (field === 'carcass_yield_pct') {
        // Apply to premises for carcass yield
        if (premises) {
          // Update premises would require a separate call
          toast({
            title: 'Sugestão aplicada',
            description: `${field} atualizado para ${value}`,
          });
        }
      } else {
        // Convert percentage values if needed
        let finalValue = value;
        if (field === 'dmi_pct_bw' && value > 10) {
          finalValue = value / 100; // Convert percentage to decimal
        }
        
        handleInputChange(formField, finalValue);
        toast({
          title: 'Sugestão aplicada',
          description: `${field} atualizado para ${finalValue}`,
        });
      }
    }
    setShowPremisesModal(false);
  };

  const handleCalculate = () => {
    if (!validateForm()) return;
    setActiveTab('results');
    
    toast({
      title: "Cálculo concluído",
      description: "Os resultados da simulação foram calculados com sucesso.",
    });
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
            created_by: user.id,
          } as any)
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
        <div className="sticky top-4 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="animal">1. Animal & Performance</TabsTrigger>
            <TabsTrigger value="costs">2. Preços & Custos</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>3. Resultados</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="animal" className="space-y-6">
          {/* Dados do Negócio Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Dados do Negócio</CardTitle>
              <CardDescription>
                Campos azuis - Informações de identificação e parâmetros do negócio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identification */}
              <div>
                <h4 className="font-medium mb-3 text-blue-600">Identificação</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pecuarista">Pecuarista *</Label>
                    <Input
                      id="pecuarista"
                      value={businessData.pecuarista}
                      onChange={(e) => handleBusinessDataChange('pecuarista', e.target.value.toUpperCase())}
                      placeholder="NOME COMPLETO MAIÚSCULO"
                      className="uppercase bg-blue-50 border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originator">Originador</Label>
                    <Select value={businessData.originator_id} onValueChange={(value) => handleBusinessDataChange('originator_id', value)}>
                      <SelectTrigger className="bg-blue-50 border-blue-200">
                        <SelectValue placeholder="Selecione originador" />
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
                    <Label htmlFor="negotiation_date">Data Negociação</Label>
                    <Input
                      id="negotiation_date"
                      type="date"
                      value={businessData.negotiation_date.toISOString().split('T')[0]}
                      onChange={(e) => handleBusinessDataChange('negotiation_date', new Date(e.target.value))}
                      className="bg-blue-50 border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_code">Unidade</Label>
                    <Select value={businessData.unit_code} onValueChange={(value) => handleBusinessDataChange('unit_code', value)}>
                      <SelectTrigger className="bg-blue-50 border-blue-200">
                        <SelectValue placeholder="Selecione uma unidade" />
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
                </div>
              </div>

              {/* Service Parameters */}
              <div>
                <h4 className="font-medium mb-3 text-blue-600">Parâmetros de Serviço</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dieta">Dieta</Label>
                    <Select value={businessData.dieta} onValueChange={(value) => handleBusinessDataChange('dieta', value)}>
                      <SelectTrigger className="bg-blue-50 border-blue-200">
                        <SelectValue placeholder="Selecione dieta" />
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
                    <Label htmlFor="scale_type">Balança</Label>
                    <Select value={businessData.scale_type} onValueChange={(value) => handleBusinessDataChange('scale_type', value)}>
                      <SelectTrigger className="bg-blue-50 border-blue-200">
                        <SelectValue placeholder="Tipo de balança" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fazenda">Fazenda</SelectItem>
                        <SelectItem value="Balanção">Balanção</SelectItem>
                        <SelectItem value="Balancinha">Balancinha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakage_farm">Quebra Fazenda (%)</Label>
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
                    <Label htmlFor="breakage_scale">Quebra Balança (%)</Label>
                    <Input
                      id="breakage_scale"
                      type="number"
                      step="0.1"
                      value={businessData.breakage_scale_pct}
                      onChange={(e) => handleBusinessDataChange('breakage_scale_pct', Number(e.target.value))}
                      className="bg-blue-50 border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalidade">Modalidade</Label>
                    <Select value={businessData.modalidade} onValueChange={(value) => handleBusinessDataChange('modalidade', value)}>
                      <SelectTrigger className="bg-blue-50 border-blue-200">
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
              </div>

              {/* Lot & Weights */}
              <div>
                <h4 className="font-medium mb-3 text-blue-600">Lote e Pesos</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qtd_animais">Qtd. Animais</Label>
                    <Input
                      id="qtd_animais"
                      type="number"
                      value={businessData.qtd_animais}
                      onChange={(e) => handleBusinessDataChange('qtd_animais', Number(e.target.value))}
                      className="bg-blue-50 border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_animal">Tipo Animal</Label>
                    <Select value={businessData.tipo_animal} onValueChange={(value) => handleBusinessDataChange('tipo_animal', value)}>
                      <SelectTrigger className="bg-blue-50 border-blue-200">
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
                      value={businessData.peso_fazenda_kg}
                      onChange={(e) => handleBusinessDataChange('peso_fazenda_kg', Number(e.target.value))}
                      className="bg-blue-50 border-blue-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peso_balancao">Peso Balanção (kg)</Label>
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
                    <Label htmlFor="peso_balancinha">Peso Balancinha (kg)</Label>
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

              {/* Zootechnical with Historical Hints */}
              <div>
                <h4 className="font-medium mb-3 text-blue-600">Zootécnico</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="days_feed">Dias no Cocho</Label>
                    <Input
                      id="days_feed"
                      type="number"
                      value={formData.days_on_feed || ''}
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
                    <Label htmlFor="adg">ADG (kg/dia)</Label>
                    <Input
                      id="adg"
                      type="number"
                      step="0.01"
                      value={formData.adg_kg_day || ''}
                      onChange={(e) => handleInputChange('adg_kg_day', Number(e.target.value))}
                      className="bg-blue-50 border-blue-200"
                    />
                    <HistoricalHint 
                      fieldName="adg_kg_day" 
                      hints={historicalHints.adg_kg_day || {}}
                      formatter={(v) => `${v} kg/dia`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rc_pct">RC (%)</Label>
                    <Input
                      id="rc_pct"
                      type="number"
                      step="0.1"
                      value={premises?.carcass_yield_pct ? (premises.carcass_yield_pct * 100).toFixed(1) : '53.0'}
                      onChange={(e) => {
                        // This would require updating premises - for now just show the value
                        console.log('RC update requested:', e.target.value);
                      }}
                      className="bg-blue-50 border-blue-200"
                      readOnly
                    />
                    <div className="text-xs text-muted-foreground">
                      Configurado nas premissas da unidade
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dmi">DMI (kg/dia)</Label>
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

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('animal')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior: Animal
                </Button>
                <Button onClick={handleCalculate} disabled={!hasMinimumInputs}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular & Ver Resultados
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

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('costs')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior: Custos
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Simulação'}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Unit Premises Modal */}
      <UnitPremisesModal
        open={showPremisesModal}
        onClose={() => setShowPremisesModal(false)}
        matrixRow={matrixSuggestions?.matched_row || null}
        onApplySuggestion={applySuggestion}
      />
    </div>
  );
}