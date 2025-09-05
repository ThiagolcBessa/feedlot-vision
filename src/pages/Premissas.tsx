import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/services/calculations';
import { fetchUnits, fetchAnimalTypes, fetchModalidades, fetchDietas } from '@/services/registryServices';

interface MatrixRow {
  id: string;
  unit_code: string;
  modalidade: string;
  dieta: string;
  tipo_animal: string;
  peso_de_kg: number | null;
  peso_ate_kg: number | null;
  dias_cocho: number | null;
  gmd_kg_dia: number | null;
  pct_pv: number | null;
  consumo_ms_kg_dia: number | null;
  pct_rc: number | null;
  custo_ms_total: number | null;
  tabela_final_r_por_arroba: number | null;
  tabela_base_r_por_arroba: number | null;
  diaria_r_por_cab_dia: number | null;
  concat_label: string;
  faixa_label: string | null;
  start_validity: string | null;
  end_validity: string | null;
  is_active: boolean;
  
  // Boitel operational costs
  ctr_r: number | null;
  cf_r: number | null;
  corp_r: number | null;
  depr_r: number | null;
  fin_r: number | null;
  custo_fixo_outros_r: number | null;
  sanitario_pct: number | null;
  mortes_pct: number | null;
  rejeito_pct: number | null;
}

interface Filters {
  unit_code: string;
  modalidade: string;
  dieta: string;
  tipo_animal: string;
  validity: 'current' | 'all' | 'custom';
  start_date: string;
  end_date: string;
}

export default function Premissas() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [data, setData] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Filter options
  const [units, setUnits] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [dietas, setDietas] = useState<string[]>([]);
  const [tiposAnimal, setTiposAnimal] = useState<string[]>([]);
  
  // Filters state
  const [filters, setFilters] = useState<Filters>({
    unit_code: searchParams.get('unit') || 'all',
    modalidade: searchParams.get('modalidade') || 'all',
    dieta: searchParams.get('dieta') || 'all',
    tipo_animal: searchParams.get('tipo_animal') || 'all',
    validity: 'current',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadFilterOptions();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      const [unitsData, modalidadesData, dietasData, tiposData] = await Promise.all([
        fetchUnits(),
        fetchModalidades(),
        fetchDietas(),
        fetchAnimalTypes(),
      ]);
      
      setUnits(unitsData);
      setModalidades(modalidadesData);
      setDietas(dietasData);
      setTiposAnimal(tiposData);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('unit_price_matrix' as any)
        .select('*');

      // Apply filters
      if (filters.unit_code && filters.unit_code !== 'all') {
        query = query.eq('unit_code', filters.unit_code);
      }
      if (filters.modalidade && filters.modalidade !== 'all') {
        query = query.eq('modalidade', filters.modalidade);
      }
      if (filters.dieta && filters.dieta !== 'all') {
        query = query.eq('dieta', filters.dieta);
      }
      if (filters.tipo_animal && filters.tipo_animal !== 'all') {
        query = query.eq('tipo_animal', filters.tipo_animal);
      }

      // Apply validity filter
      const today = new Date().toISOString().split('T')[0];
      if (filters.validity === 'current') {
        query = query
          .or(`start_validity.is.null,start_validity.lte.${today}`)
          .or(`end_validity.is.null,end_validity.gte.${today}`);
      } else if (filters.validity === 'custom' && filters.start_date && filters.end_date) {
        query = query
          .gte('start_validity', filters.start_date)
          .lte('end_validity', filters.end_date);
      }

      query = query.order('unit_code').order('modalidade').order('dieta').order('tipo_animal');

      const { data: matrixData, error } = await query;

      if (error) {
        console.error('Matrix query error:', error);
        // Return empty array on error to avoid type issues
        setData([]);
        return;
      }

      setData((matrixData as unknown as MatrixRow[]) || []);
    } catch (error) {
      console.error('Error loading matrix data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da matriz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      unit_code: 'all',
      modalidade: 'all',
      dieta: 'all',
      tipo_animal: 'all',
      validity: 'current',
      start_date: '',
      end_date: '',
    });
  };

  const isCurrentRow = (row: MatrixRow) => {
    const today = new Date().toISOString().split('T')[0];
    const startValid = !row.start_validity || row.start_validity <= today;
    const endValid = !row.end_validity || row.end_validity >= today;
    return startValid && endValid && row.is_active;
  };

  const columns = [
    { 
      key: 'unit_code', 
      label: 'Unidade', 
      sortable: true,
      render: (value: string, row: MatrixRow) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          {isCurrentRow(row) && <Badge variant="default" className="text-xs">Vigente</Badge>}
        </div>
      )
    },
    { key: 'modalidade', label: 'Modalidade' },
    { key: 'dieta', label: 'Dieta' },
    { key: 'tipo_animal', label: 'Tipo Animal' },
    { key: 'faixa_label', label: 'Faixa Peso' },
    { 
      key: 'tabela_base_r_por_arroba', 
      label: 'Base R$/@ ',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { 
      key: 'tabela_final_r_por_arroba', 
      label: 'Final R$/@',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { 
      key: 'diaria_r_por_cab_dia', 
      label: 'Diária R$/cab',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { key: 'dias_cocho', label: 'Dias Cocho' },
    { 
      key: 'gmd_kg_dia', 
      label: 'GMD kg/dia',
      render: (value: number) => value ? value.toFixed(2) : '-'
    },
    { 
      key: 'pct_pv', 
      label: 'PV %',
      render: (value: number) => value ? `${value.toFixed(1)}%` : '-'
    },
    { 
      key: 'consumo_ms_kg_dia', 
      label: 'Consumo MS kg/dia',
      render: (value: number) => value ? value.toFixed(2) : '-'
    },
    { 
      key: 'pct_rc', 
      label: 'RC %',
      render: (value: number) => value ? `${value.toFixed(1)}%` : '-'
    },
    { 
      key: 'custo_ms_total', 
      label: 'Custo MS Total',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { 
      key: 'ctr_r', 
      label: 'CTR R$',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { 
      key: 'cf_r', 
      label: 'CF R$',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { 
      key: 'corp_r', 
      label: 'Corp R$',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { 
      key: 'depr_r', 
      label: 'Depr R$',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { 
      key: 'fin_r', 
      label: 'Fin R$',
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    { 
      key: 'sanitario_pct', 
      label: 'Sanitário %',
      render: (value: number) => value ? `${value.toFixed(1)}%` : '-'
    },
    { 
      key: 'mortes_pct', 
      label: 'Mortes %',
      render: (value: number) => value ? `${value.toFixed(1)}%` : '-'
    },
    { 
      key: 'rejeito_pct', 
      label: 'Rejeito %',
      render: (value: number) => value ? `${value.toFixed(1)}%` : '-'
    },
    {
      key: 'validity_period',
      label: 'Validade',
      render: (_: any, row: MatrixRow) => {
        const start = row.start_validity ? new Date(row.start_validity).toLocaleDateString('pt-BR') : 'Sem início';
        const end = row.end_validity ? new Date(row.end_validity).toLocaleDateString('pt-BR') : 'Sem fim';
        return (
          <div className="text-sm">
            <div>{start}</div>
            <div>até {end}</div>
          </div>
        );
      }
    },
  ];

  const formFields = [
    { key: 'unit_code', label: 'Código Unidade', type: 'text', required: true },
    { key: 'modalidade', label: 'Modalidade', type: 'text', required: true },
    { key: 'dieta', label: 'Dieta', type: 'text', required: true },
    { key: 'tipo_animal', label: 'Tipo Animal', type: 'text', required: true },
    { key: 'peso_de_kg', label: 'Peso De (kg)', type: 'number' },
    { key: 'peso_ate_kg', label: 'Peso Até (kg)', type: 'number' },
    { key: 'dias_cocho', label: 'Dias Cocho', type: 'number' },
    { key: 'gmd_kg_dia', label: 'GMD kg/dia', type: 'number', step: '0.01' },
    { key: 'pct_pv', label: 'PV %', type: 'number', step: '0.1' },
    { key: 'consumo_ms_kg_dia', label: 'Consumo MS kg/dia', type: 'number', step: '0.01' },
    { key: 'pct_rc', label: 'RC %', type: 'number', step: '0.1' },
    { key: 'custo_ms_total', label: 'Custo MS Total', type: 'number', step: '0.01' },
    { key: 'tabela_base_r_por_arroba', label: 'Tabela Base R$/@', type: 'number', step: '0.01' },
    { key: 'tabela_final_r_por_arroba', label: 'Tabela Final R$/@', type: 'number', step: '0.01' },
    { key: 'diaria_r_por_cab_dia', label: 'Diária R$/cab/dia', type: 'number', step: '0.01' },
    { key: 'ctr_r', label: 'CTR R$', type: 'number', step: '0.01' },
    { key: 'cf_r', label: 'CF R$', type: 'number', step: '0.01' },
    { key: 'corp_r', label: 'Corp R$', type: 'number', step: '0.01' },
    { key: 'depr_r', label: 'Depr R$', type: 'number', step: '0.01' },
    { key: 'fin_r', label: 'Fin R$', type: 'number', step: '0.01' },
    { key: 'custo_fixo_outros_r', label: 'Outros Fixos R$', type: 'number', step: '0.01' },
    { key: 'sanitario_pct', label: 'Sanitário %', type: 'number', step: '0.1' },
    { key: 'mortes_pct', label: 'Mortes %', type: 'number', step: '0.1' },
    { key: 'rejeito_pct', label: 'Rejeito %', type: 'number', step: '0.1' },
    { key: 'start_validity', label: 'Início Validade', type: 'date' },
    { key: 'end_validity', label: 'Fim Validade', type: 'date' },
  ];

  const handleCreate = async (values: any) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('unit_price_matrix' as any)
        .insert([values]);

      if (error) throw error;

      await loadData();
      toast({
        title: "Sucesso",
        description: "Registro criado com sucesso",
      });
    } catch (error) {
      console.error('Error creating record:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar registro",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdate = async (id: string, values: any) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('unit_price_matrix' as any)
        .update(values)
        .eq('id', id);

      if (error) throw error;

      await loadData();
      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar registro",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('unit_price_matrix' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadData();
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir registro",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Get highlighted row ID from URL params
  const highlightedRowId = searchParams.get('highlight');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Matriz de Premissas</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie a matriz de preços e premissas das unidades
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unidade</label>
              <Select value={filters.unit_code} onValueChange={(value) => handleFilterChange('unit_code', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas unidades</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.code} value={unit.code}>
                      {unit.code} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Modalidade</label>
              <Select value={filters.modalidade} onValueChange={(value) => handleFilterChange('modalidade', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas modalidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas modalidades</SelectItem>
                  {modalidades.map((modalidade) => (
                    <SelectItem key={modalidade} value={modalidade}>
                      {modalidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dieta</label>
              <Select value={filters.dieta} onValueChange={(value) => handleFilterChange('dieta', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas dietas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas dietas</SelectItem>
                  {dietas.map((dieta) => (
                    <SelectItem key={dieta} value={dieta}>
                      {dieta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo Animal</label>
              <Select value={filters.tipo_animal} onValueChange={(value) => handleFilterChange('tipo_animal', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tipos</SelectItem>
                  {tiposAnimal.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Validade</label>
              <Select value={filters.validity} onValueChange={(value) => handleFilterChange('validity', value as 'current' | 'all' | 'custom')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Vigentes hoje</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="custom">Período customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.validity === 'custom' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Fim</label>
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Ações</label>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Matriz de Preços
          </CardTitle>
          <CardDescription>
            {data.length} registro(s) encontrado(s)
            {!isAdmin && " (somente leitura)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data}
            columns={columns}
            loading={loading}
            error={null}
            onCreate={isAdmin ? handleCreate : undefined}
            onUpdate={isAdmin ? handleUpdate : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
            formFields={formFields}
            searchPlaceholder="Buscar na matriz..."
            searchField="concat_label"
            emptyTitle="Nenhum registro encontrado"
            emptyDescription="Ajuste os filtros para encontrar registros"
          />
        </CardContent>
      </Card>
    </div>
  );
}