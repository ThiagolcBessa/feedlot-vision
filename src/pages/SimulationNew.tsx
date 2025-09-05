import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Calculator, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Import the new block components
import { DadosNegocioBlock } from '@/components/simulation/DadosNegocioBlock';
import { FretesTaxasBlock } from '@/components/simulation/FretesTaxasBlock';
import { QuebrasPesoBlock } from '@/components/simulation/QuebrasPesoBlock';
import { ZootecnicosBlock } from '@/components/simulation/ZootecnicosBlock';
import { MercadoBlock } from '@/components/simulation/MercadoBlock';
import { PriceResolverPanel } from '@/components/simulation/PriceResolverPanel';
import { LiveCalculationsPanel } from '@/components/simulation/LiveCalculationsPanel';

import { SaveOrchestrator } from '@/services/saveOrchestrator';
import { simulationSchema, type SimulationFormType } from '@/schemas/simulationSchema';

export default function SimulationNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState<SimulationFormType>({
    title: 'Nova Simulação',
    pecuarista_name: '',
    originator_id: user?.id || '',
    date_ref: new Date(),
    unit_code: '',
    dieta: '',
    scale_type: 'Balanção',
    modalidade: 'Diária',
    quebra_fazenda_pct: 0.02, // 2% as fraction
    quebra_balanca_pct: 0.01, // 1% as fraction
    qtd_animais: 100,
    tipo_animal: '',
    peso_fazenda_kg: 0,
    peso_entrada_balancao_kg: 0,
    peso_entrada_balancinha_kg: 0,
    dias_cocho: 120,
    gmd_kg_dia: 1.4,
    rc_pct: 0.53, // 53% as fraction
    dmi_kg_dia: 0,
    pct_pv: 0.025, // 2.5% as fraction
    custo_ms_kg: 0.45,
    desperdicio_ms_pct: 0.05, // 5% as fraction
    rendimento_boi_magro_prod_pct: 0.50, // 50% as fraction
    preco_boi_magro_r_por_arroba: 165.0,
    preco_boi_gordo_r_por_arroba: 185.0,
    agio_magro_r: -20.0, // Will be calculated
    notes: '',
  });

  // User editable fields (separate from main form)
  const [userEditableFields, setUserEditableFields] = useState({
    frete_confinamento_r: 0,
    frete_pecuarista_r: 0,
    taxa_abate_r: 0,
    icms_devolucao_r: 0,
  });

  // Matrix resolved data
  const [matrixRow, setMatrixRow] = useState<any>(null);
  const [canSave, setCanSave] = useState(false);

  // Profile data for originator selection
  const [profiles, setProfiles] = useState<Array<{ id: string; first_name?: string; last_name?: string }>>([]);

  // Historical medians for hints
  const [historicalHints, setHistoricalHints] = useState<{[key: string]: { unit_median?: number; originator_median?: number }}>({});

  // Load initial data
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setSimulationId(editId);
      loadSimulation(editId);
    }
    loadProfiles();
  }, [searchParams]);

  // Validate if save is possible
  useEffect(() => {
    const validation = simulationSchema.safeParse(formData);
    const hasMatrixPrice = matrixRow !== null;
    setCanSave(validation.success && hasMatrixPrice);
  }, [formData, matrixRow]);

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

  const loadSimulation = async (id: string) => {
    try {
      // Load simulation data (convert from old format if needed)
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
          pct_pv: 0.025,
          custo_ms_kg: simData.feed_cost_kg_dm,
          desperdicio_ms_pct: 0.05,
          rendimento_boi_magro_prod_pct: 0.50,
          preco_boi_magro_r_por_arroba: simData.purchase_price_per_at || 165,
          preco_boi_gordo_r_por_arroba: simData.selling_price_per_at,
          agio_magro_r: 0,
          notes: simData.notes || '',
        };

        setFormData(convertedFormData);
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

  const handleFormDataChange = (newFormData: SimulationFormType) => {
    setFormData(newFormData);
  };

  const handleUserEditableChange = (field: string, value: number) => {
    setUserEditableFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePriceResolved = (resolvedData: any) => {
    setMatrixRow(resolvedData);
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

    if (!canSave) {
      toast({
        title: "Dados incompletos",
        description: "Complete todos os campos obrigatórios e aguarde a resolução do preço.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const orchestrator = new SaveOrchestrator();
      
      const result = await orchestrator.saveSimulation(
        formData,
        null, // premises
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
      {/* Header */}
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
        <Button 
          onClick={handleSave}
          disabled={!canSave || isSaving}
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

      {/* Warning if cannot save */}
      {!canSave && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Complete todos os campos obrigatórios e aguarde a resolução automática do preço da matriz para habilitar o salvamento.
          </AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Blocks */}
        <div className="lg:col-span-2 space-y-6">
          <DadosNegocioBlock
            data={formData}
            onChange={handleFormDataChange}
            profiles={profiles}
          />

          <FretesTaxasBlock
            frete_confinamento_r={userEditableFields.frete_confinamento_r}
            frete_pecuarista_r={userEditableFields.frete_pecuarista_r}
            taxa_abate_r={userEditableFields.taxa_abate_r}
            icms_devolucao_r={userEditableFields.icms_devolucao_r}
            onChange={handleUserEditableChange}
          />

          <QuebrasPesoBlock
            data={formData}
            onChange={handleFormDataChange}
          />

          <ZootecnicosBlock
            data={formData}
            onChange={handleFormDataChange}
            matrixSuggestions={matrixRow}
            historicalHints={historicalHints}
          />

          <MercadoBlock
            data={formData}
            onChange={handleFormDataChange}
          />
        </div>

        {/* Right Column - Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <PriceResolverPanel
              formData={formData}
              onPriceResolved={handlePriceResolved}
            />

            <LiveCalculationsPanel
              formData={formData}
              matrixRow={matrixRow}
              userEditableFields={userEditableFields}
            />
          </div>
        </div>
      </div>
    </div>
  );
}