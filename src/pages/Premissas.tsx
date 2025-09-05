import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Filter, Database, Plus, Upload, Download, Play, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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
  custo_ms_dia_racao_kg: number | null;
  
  created_at?: string;
  updated_at_table?: string;
}

interface Filters {
  unit_code: string;
  modalidade: string;
  dieta: string;
  tipo_animal: string;
  validity: 'current' | 'all' | 'custom';
  start_date: string;
  end_date: string;
  search: string;
}

interface ImportRow extends Partial<MatrixRow> {
  _rowIndex: number;
  _errors: string[];
  _warnings: string[];
  _status: 'valid' | 'warning' | 'error';
}

interface FormData {
  [key: string]: any;
}

const PERCENTAGE_FIELDS = ['pct_pv', 'pct_rc', 'sanitario_pct', 'mortes_pct', 'rejeito_pct'];
const REQUIRED_FIELDS = ['unit_code', 'modalidade', 'dieta', 'tipo_animal', 'peso_de_kg', 'start_validity'];
const MONETARY_FIELDS = ['tabela_base_r_por_arroba', 'tabela_final_r_por_arroba', 'diaria_r_por_cab_dia', 'custo_ms_total', 'ctr_r', 'cf_r', 'corp_r', 'depr_r', 'fin_r', 'custo_fixo_outros_r', 'custo_ms_dia_racao_kg'];

export default function Premissas() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [data, setData] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
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
    search: '',
  });

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<MatrixRow | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [importResults, setImportResults] = useState<{inserted: number, updated: number, errors: ImportRow[]}>({inserted: 0, updated: 0, errors: []});

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    checkAdminStatus();
    loadFilterOptions();
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    loadData();
  }, [filters]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .single();
      
      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Get distinct values from unit_price_matrix and join with units for friendly names
      const [
        { data: unitsData }, 
        { data: modalidadesData }, 
        { data: dietasData }, 
        { data: tiposData }
      ] = await Promise.all([
        supabase.from('unit_price_matrix').select('unit_code').then(async ({ data }) => {
          const unitCodes = [...new Set(data?.map(row => row.unit_code) || [])];
          const { data: unitsWithNames } = await supabase
            .from('units')
            .select('code, name')
            .in('code', unitCodes);
          return { data: unitsWithNames || [] };
        }),
        supabase.from('unit_price_matrix').select('modalidade'),
        supabase.from('unit_price_matrix').select('dieta'),
        supabase.from('unit_price_matrix').select('tipo_animal'),
      ]);
      
      setUnits(unitsData || []);
      setModalidades([...new Set(modalidadesData?.map(row => row.modalidade) || [])]);
      setDietas([...new Set(dietasData?.map(row => row.dieta) || [])]);
      setTiposAnimal([...new Set(tiposData?.map(row => row.tipo_animal) || [])]);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadData = async (page = 0, append = false) => {
    setLoading(!append);
    try {
      let query = supabase
        .from('unit_price_matrix')
        .select('*', { count: 'exact' });

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
          .lte('start_validity', today)
          .or('end_validity.is.null,end_validity.gte.' + today);
      } else if (filters.validity === 'custom' && filters.start_date && filters.end_date) {
        query = query
          .gte('start_validity', filters.start_date)
          .lte('end_validity', filters.end_date);
      }

      // Apply search filter
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`unit_code.ilike.%${searchTerm}%,modalidade.ilike.%${searchTerm}%,dieta.ilike.%${searchTerm}%,tipo_animal.ilike.%${searchTerm}%,concat_label.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      query = query
        .order('unit_code')
        .order('modalidade')
        .order('dieta')
        .order('tipo_animal')
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      const { data: matrixData, error, count } = await query;

      if (error) {
        console.error('Matrix query error:', error);
        if (!append) setData([]);
        return;
      }

      const newData = (matrixData as unknown as MatrixRow[]) || [];
      
      if (append) {
        setData(prev => [...prev, ...newData]);
      } else {
        setData(newData);
      }
      
      setTotalCount(count || 0);
      setHasMore(newData.length === ITEMS_PER_PAGE);
      setCurrentPage(page);
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

  const loadMore = () => {
    if (hasMore && !loading) {
      loadData(currentPage + 1, true);
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
      search: '',
    });
  };

  const isCurrentRow = (row: MatrixRow) => {
    const today = new Date().toISOString().split('T')[0];
    const startValid = !row.start_validity || row.start_validity <= today;
    const endValid = !row.end_validity || row.end_validity >= today;
    return startValid && endValid && row.is_active;
  };

  // Utility functions for form handling
  const formatPercentageForInput = (value: number | null): string => {
    if (value === null || value === undefined) return '';
    return (value * 100).toString();
  };

  const parsePercentageFromInput = (value: string): number | null => {
    if (!value.trim()) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num / 100;
  };

  const validateOverlaps = async (formData: FormData, excludeId?: string): Promise<string[]> => {
    const errors: string[] = [];
    
    if (!formData.unit_code || !formData.modalidade || !formData.dieta || !formData.tipo_animal) {
      return errors; // Can't check overlaps without these fields
    }

    try {
      let query = supabase
        .from('unit_price_matrix')
        .select('id, peso_de_kg, peso_ate_kg, start_validity, end_validity')
        .eq('unit_code', formData.unit_code)
        .eq('modalidade', formData.modalidade)
        .eq('dieta', formData.dieta)
        .eq('tipo_animal', formData.tipo_animal);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data: existingRows } = await query;

      if (!existingRows) return errors;

      const newWeightMin = formData.peso_de_kg || 0;
      const newWeightMax = formData.peso_ate_kg || Infinity;
      const newValidityStart = formData.start_validity || '1900-01-01';
      const newValidityEnd = formData.end_validity || '9999-12-31';

      for (const row of existingRows) {
        const existingWeightMin = row.peso_de_kg || 0;
        const existingWeightMax = row.peso_ate_kg || Infinity;
        const existingValidityStart = row.start_validity || '1900-01-01';
        const existingValidityEnd = row.end_validity || '9999-12-31';

        // Check weight range overlap
        const weightOverlap = !(newWeightMax <= existingWeightMin || newWeightMin >= existingWeightMax);
        
        // Check validity period overlap
        const validityOverlap = !(newValidityEnd < existingValidityStart || newValidityStart > existingValidityEnd);

        if (weightOverlap && validityOverlap) {
          errors.push(`Conflito: já existe outra linha vigente sobre a mesma faixa de peso e período (linha #${row.id.slice(-8)}). Ajuste as datas ou os pesos.`);
        }
      }
    } catch (error) {
      console.error('Error checking overlaps:', error);
    }

    return errors;
  };

  const validateForm = (data: FormData): string[] => {
    const errors: string[] = [];

    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!data[field as keyof MatrixRow]) {
        errors.push(`Campo obrigatório: ${field}`);
      }
    });

    // Check modalidade-specific requirements
    if (data.modalidade === 'Arroba Prod.' && !data.tabela_final_r_por_arroba) {
      errors.push('Tabela Final R$/@ é obrigatória para modalidade Arroba Prod.');
    }
    if (data.modalidade === 'Diária' && !data.diaria_r_por_cab_dia) {
      errors.push('Diária R$/cab/dia é obrigatória para modalidade Diária');
    }

    // Check weight range logic
    if (data.peso_de_kg && data.peso_ate_kg && data.peso_de_kg >= data.peso_ate_kg) {
      errors.push('Peso Até deve ser maior que Peso De');
    }

    // Check date range logic
    if (data.start_validity && data.end_validity && data.start_validity > data.end_validity) {
      errors.push('Data Fim deve ser posterior à Data Início');
    }

    return errors;
  };

  const openCreateDialog = () => {
    setFormData({});
    setFormErrors([]);
    setShowCreateDialog(true);
  };

  const openEditDialog = (row: MatrixRow) => {
    setEditingRow(row);
    // Convert percentages back to display format
    const editData = { ...row };
    PERCENTAGE_FIELDS.forEach(field => {
      if (editData[field as keyof MatrixRow] !== null) {
        (editData as any)[field] = formatPercentageForInput(editData[field as keyof MatrixRow] as number);
      }
    });
    setFormData(editData);
    setFormErrors([]);
    setShowEditDialog(true);
  };

  const handleFormSubmit = async (isEdit = false) => {
    setUpdating(true);
    try {
      // Prepare data for submission
      const submitData = { ...formData };
      
      // Convert percentage fields from display format to storage format
      PERCENTAGE_FIELDS.forEach(field => {
        if (submitData[field as keyof typeof submitData]) {
          (submitData as any)[field] = parsePercentageFromInput(String(submitData[field as keyof typeof submitData]));
        }
      });

      // Validate form
      const validationErrors = validateForm(submitData);
      if (validationErrors.length > 0) {
        setFormErrors(validationErrors);
        return;
      }

      // Check for overlaps
      const overlapErrors = await validateOverlaps(submitData, isEdit ? editingRow?.id : undefined);
      if (overlapErrors.length > 0) {
        setFormErrors(overlapErrors);
        return;
      }

      // Generate concat_label if not provided
      if (!submitData.concat_label) {
        submitData.concat_label = `${submitData.unit_code}${submitData.tipo_animal}${submitData.peso_de_kg || 0}${submitData.peso_ate_kg || 999}${submitData.modalidade}`;
      }

      // Remove undefined/null values and ensure required fields
      const cleanData = Object.fromEntries(
        Object.entries(submitData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      // Submit to database
      const { error } = isEdit
        ? await supabase
            .from('unit_price_matrix')
            .update(cleanData as any)
            .eq('id', editingRow!.id)
        : await supabase
            .from('unit_price_matrix')
            .insert([cleanData as any]);

      if (error) {
        if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
          toast({
            title: "Erro",
            description: "Apenas admins podem alterar premissas.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      await loadData();
      toast({
        title: "Sucesso",
        description: `Registro ${isEdit ? 'atualizado' : 'criado'} com sucesso`,
      });
      
      setShowCreateDialog(false);
      setShowEditDialog(false);
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} record:`, error);
      toast({
        title: "Erro",
        description: `Erro ao ${isEdit ? 'atualizar' : 'criar'} registro`,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('unit_price_matrix')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
          toast({
            title: "Erro",
            description: "Apenas admins podem alterar premissas.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

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

  // Import functionality
  const handleFileUpload = async (file: File) => {
    setImportFile(file);
    setImportStep('preview');
    
    try {
      // Dynamic import to reduce bundle size
      const { read, utils } = await import('xlsx');
      
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        toast({
          title: "Erro",
          description: "Arquivo deve ter pelo menos uma linha de cabeçalho e uma linha de dados",
          variant: "destructive",
        });
        return;
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      const processedData: ImportRow[] = rows.map((row, index) => {
        const rowData: any = {};
        headers.forEach((header, colIndex) => {
          rowData[header] = row[colIndex];
        });
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Basic validation
        REQUIRED_FIELDS.forEach(field => {
          if (!rowData[field]) {
            errors.push(`Campo obrigatório: ${field}`);
          }
        });
        
        // Convert percentage fields
        PERCENTAGE_FIELDS.forEach(field => {
          if (rowData[field] && typeof rowData[field] === 'string') {
            const num = parseFloat(rowData[field].replace('%', ''));
            if (!isNaN(num)) {
              rowData[field] = num / 100;
            }
          }
        });

        const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
        
        return {
          ...rowData,
          _rowIndex: index + 2, // +2 because of header and 0-based index
          _errors: errors,
          _warnings: warnings,
          _status: status,
        };
      });
      
      setImportData(processedData);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo",
        variant: "destructive",
      });
    }
  };

  const processImport = async () => {
    setImportStep('processing');
    const validRows = importData.filter(row => row._status !== 'error');
    const results = { inserted: 0, updated: 0, errors: [] as ImportRow[] };
    
    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      
      try {
        const cleanBatch = batch.map(row => {
          const { _rowIndex, _errors, _warnings, _status, ...data } = row;
          
          // Ensure concat_label is generated
          if (!data.concat_label) {
            data.concat_label = `${data.unit_code}${data.tipo_animal}${data.peso_de_kg || 0}${data.peso_ate_kg || 999}${data.modalidade}`;
          }
          
          // Clean undefined/null values
          return Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined && value !== null && value !== '')
          );
        });

        const { error } = await supabase
          .from('unit_price_matrix')
          .insert(cleanBatch as any);

        if (error) {
          batch.forEach(row => {
            results.errors.push({ ...row, _errors: [...row._errors, error.message] });
          });
        } else {
          results.inserted += batch.length; // Simplified - in real scenario, you'd distinguish insert vs update
        }
      } catch (error: any) {
        batch.forEach(row => {
          results.errors.push({ ...row, _errors: [...row._errors, error.message] });
        });
      }
    }
    
    // Add rows with validation errors to results
    results.errors.push(...importData.filter(row => row._status === 'error'));
    
    setImportResults(results);
    setImportStep('complete');
    await loadData();
  };

  const downloadTemplate = () => {
    const template = [
      ['unit_code', 'modalidade', 'dieta', 'tipo_animal', 'peso_de_kg', 'peso_ate_kg', 'start_validity', 'end_validity', 'tabela_final_r_por_arroba', 'diaria_r_por_cab_dia', 'dias_cocho', 'gmd_kg_dia', 'pct_pv', 'consumo_ms_kg_dia', 'pct_rc', 'custo_ms_total'],
      ['UN01', 'Arroba Prod.', 'Milho', 'Macho', '300', '450', '2024-01-01', '2024-12-31', '18.50', '', '105', '1.6', '2.4', '8.5', '55.5', '1335.61']
    ];
    
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_premissas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrors = () => {
    if (importResults.errors.length === 0) return;
    
    const headers = ['Linha', 'Erros', ...Object.keys(importResults.errors[0]).filter(k => !k.startsWith('_'))];
    const rows = importResults.errors.map(row => [
      row._rowIndex,
      row._errors.join('; '),
      ...Object.entries(row).filter(([k]) => !k.startsWith('_')).map(([, v]) => v)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erros_importacao.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Matriz de Premissas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie a matriz de preços e premissas das unidades
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </div>
        )}
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
              <Label>Buscar</Label>
              <Input
                placeholder="Buscar por unidade, modalidade, dieta..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
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
              <Label>Modalidade</Label>
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
              <Label>Dieta</Label>
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
              <Label>Tipo Animal</Label>
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
              <Label>Validade</Label>
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
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="invisible">Ações</Label>
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
            {totalCount} registro(s) encontrado(s) 
            {data.length < totalCount && ` (mostrando ${data.length})`}
            {!isAdmin && " (somente leitura)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && data.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-8">
              <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground mb-4">Ajuste os filtros para encontrar registros</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Dieta</TableHead>
                      <TableHead>Tipo Animal</TableHead>
                      <TableHead>Faixa Peso</TableHead>
                      <TableHead>Base R$/@</TableHead>
                      <TableHead>Final R$/@</TableHead>
                      <TableHead>Diária R$/cab</TableHead>
                      <TableHead>Dias Cocho</TableHead>
                      <TableHead>GMD kg/dia</TableHead>
                      <TableHead>PV %</TableHead>
                      <TableHead>RC %</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{row.unit_code}</span>
                            {isCurrentRow(row) && (
                              <Badge variant="default" className="text-xs bg-green-500">
                                Vigente
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{row.modalidade}</TableCell>
                        <TableCell>{row.dieta}</TableCell>
                        <TableCell>{row.tipo_animal}</TableCell>
                        <TableCell>{row.faixa_label || `${row.peso_de_kg || 0}-${row.peso_ate_kg || '∞'}kg`}</TableCell>
                        <TableCell>{row.tabela_base_r_por_arroba ? formatCurrency(row.tabela_base_r_por_arroba) : '-'}</TableCell>
                        <TableCell>{row.tabela_final_r_por_arroba ? formatCurrency(row.tabela_final_r_por_arroba) : '-'}</TableCell>
                        <TableCell>{row.diaria_r_por_cab_dia ? formatCurrency(row.diaria_r_por_cab_dia) : '-'}</TableCell>
                        <TableCell>{row.dias_cocho || '-'}</TableCell>
                        <TableCell>{row.gmd_kg_dia ? row.gmd_kg_dia.toFixed(2) : '-'}</TableCell>
                        <TableCell>{row.pct_pv ? `${(row.pct_pv * 100).toFixed(1)}%` : '-'}</TableCell>
                        <TableCell>{row.pct_rc ? `${(row.pct_rc * 100).toFixed(1)}%` : '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{row.start_validity ? new Date(row.start_validity).toLocaleDateString('pt-BR') : 'Sem início'}</div>
                            <div>até {row.end_validity ? new Date(row.end_validity).toLocaleDateString('pt-BR') : 'Sem fim'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link
                                to={`/simulation?unit=${row.unit_code}&modalidade=${encodeURIComponent(row.modalidade)}&dieta=${encodeURIComponent(row.dieta)}&tipo_animal=${encodeURIComponent(row.tipo_animal)}`}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Usar
                              </Link>
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(row)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(row.id)}
                                >
                                  Excluir
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {hasMore && (
                <div className="text-center">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Carregar mais
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? 'Editar' : 'Criar'} Registro</DialogTitle>
            <DialogDescription>
              Preencha os campos para {showEditDialog ? 'atualizar' : 'criar'} um registro na matriz de premissas.
            </DialogDescription>
          </DialogHeader>
          
          {formErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-destructive">Erros de validação:</span>
              </div>
              <ul className="list-disc pl-6 space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index} className="text-sm text-destructive">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_code">Código Unidade *</Label>
              <Input
                id="unit_code"
                value={formData.unit_code || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_code: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modalidade">Modalidade *</Label>
              <Select value={formData.modalidade || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, modalidade: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arroba Prod.">Arroba Prod.</SelectItem>
                  <SelectItem value="Diária">Diária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dieta">Dieta *</Label>
              <Input
                id="dieta"
                value={formData.dieta || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dieta: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_animal">Tipo Animal *</Label>
              <Input
                id="tipo_animal"
                value={formData.tipo_animal || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_animal: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso_de_kg">Peso De (kg) *</Label>
              <Input
                id="peso_de_kg"
                type="number"
                value={formData.peso_de_kg || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, peso_de_kg: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso_ate_kg">Peso Até (kg)</Label>
              <Input
                id="peso_ate_kg"
                type="number"
                value={formData.peso_ate_kg || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, peso_ate_kg: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_validity">Início Validade *</Label>
              <Input
                id="start_validity"
                type="date"
                value={formData.start_validity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, start_validity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_validity">Fim Validade</Label>
              <Input
                id="end_validity"
                type="date"
                value={formData.end_validity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, end_validity: e.target.value }))}
              />
            </div>

            {formData.modalidade === 'Arroba Prod.' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tabela_base_r_por_arroba">Tabela Base R$/@</Label>
                  <Input
                    id="tabela_base_r_por_arroba"
                    type="number"
                    step="0.01"
                    value={formData.tabela_base_r_por_arroba || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tabela_base_r_por_arroba: parseFloat(e.target.value) || null }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tabela_final_r_por_arroba">Tabela Final R$/@ *</Label>
                  <Input
                    id="tabela_final_r_por_arroba"
                    type="number"
                    step="0.01"
                    value={formData.tabela_final_r_por_arroba || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tabela_final_r_por_arroba: parseFloat(e.target.value) || null }))}
                  />
                </div>
              </>
            )}

            {formData.modalidade === 'Diária' && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="diaria_r_por_cab_dia">Diária R$/cab/dia *</Label>
                <Input
                  id="diaria_r_por_cab_dia"
                  type="number"
                  step="0.01"
                  value={formData.diaria_r_por_cab_dia || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, diaria_r_por_cab_dia: parseFloat(e.target.value) || null }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dias_cocho">Dias Cocho</Label>
              <Input
                id="dias_cocho"
                type="number"
                value={formData.dias_cocho || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dias_cocho: parseInt(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gmd_kg_dia">GMD kg/dia</Label>
              <Input
                id="gmd_kg_dia"
                type="number"
                step="0.01"
                value={formData.gmd_kg_dia || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, gmd_kg_dia: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pct_pv">PV %</Label>
              <Input
                id="pct_pv"
                type="number"
                step="0.1"
                value={formData.pct_pv || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pct_pv: e.target.value }))}
                placeholder="Ex: 2.4 para 2.4%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pct_rc">RC %</Label>
              <Input
                id="pct_rc"
                type="number"
                step="0.1"
                value={formData.pct_rc || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pct_rc: e.target.value }))}
                placeholder="Ex: 55.5 para 55.5%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumo_ms_kg_dia">Consumo MS kg/dia</Label>
              <Input
                id="consumo_ms_kg_dia"
                type="number"
                step="0.01"
                value={formData.consumo_ms_kg_dia || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, consumo_ms_kg_dia: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custo_ms_total">Custo MS Total</Label>
              <Input
                id="custo_ms_total"
                type="number"
                step="0.01"
                value={formData.custo_ms_total || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, custo_ms_total: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ctr_r">CTR R$</Label>
              <Input
                id="ctr_r"
                type="number"
                step="0.01"
                value={formData.ctr_r || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ctr_r: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cf_r">CF R$</Label>
              <Input
                id="cf_r"
                type="number"
                step="0.01"
                value={formData.cf_r || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cf_r: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corp_r">Corp R$</Label>
              <Input
                id="corp_r"
                type="number"
                step="0.01"
                value={formData.corp_r || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, corp_r: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depr_r">Depr R$</Label>
              <Input
                id="depr_r"
                type="number"
                step="0.01"
                value={formData.depr_r || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, depr_r: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fin_r">Fin R$</Label>
              <Input
                id="fin_r"
                type="number"
                step="0.01"
                value={formData.fin_r || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, fin_r: parseFloat(e.target.value) || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sanitario_pct">Sanitário %</Label>
              <Input
                id="sanitario_pct"
                type="number"
                step="0.1"
                value={formData.sanitario_pct || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sanitario_pct: e.target.value }))}
                placeholder="Ex: 1.2 para 1.2%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortes_pct">Mortes %</Label>
              <Input
                id="mortes_pct"
                type="number"
                step="0.1"
                value={formData.mortes_pct || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, mortes_pct: e.target.value }))}
                placeholder="Ex: 2.1 para 2.1%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejeito_pct">Rejeito %</Label>
              <Input
                id="rejeito_pct"
                type="number"
                step="0.1"
                value={formData.rejeito_pct || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rejeito_pct: e.target.value }))}
                placeholder="Ex: 1.8 para 1.8%"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={() => handleFormSubmit(showEditDialog)} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {showEditDialog ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Matriz de Premissas</DialogTitle>
            <DialogDescription>
              Importe dados de arquivo Excel (.xlsx) ou CSV
            </DialogDescription>
          </DialogHeader>

          {importStep === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">Selecione um arquivo</p>
                <p className="text-muted-foreground mb-4">Arraste um arquivo ou clique para selecionar</p>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>
          )}

          {importStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview dos dados</h3>
                <div className="flex gap-2">
                  <Badge variant="default">{importData.filter(r => r._status === 'valid').length} válidos</Badge>
                  <Badge variant="secondary">{importData.filter(r => r._status === 'warning').length} avisos</Badge>
                  <Badge variant="destructive">{importData.filter(r => r._status === 'error').length} erros</Badge>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead className="w-16">Linha</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Dieta</TableHead>
                      <TableHead>Tipo Animal</TableHead>
                      <TableHead>Peso De</TableHead>
                      <TableHead>Peso Até</TableHead>
                      <TableHead>Erros/Avisos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.slice(0, 50).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {row._status === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {row._status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {row._status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                        </TableCell>
                        <TableCell>{row._rowIndex}</TableCell>
                        <TableCell>{row.unit_code}</TableCell>
                        <TableCell>{row.modalidade}</TableCell>
                        <TableCell>{row.dieta}</TableCell>
                        <TableCell>{row.tipo_animal}</TableCell>
                        <TableCell>{row.peso_de_kg}</TableCell>
                        <TableCell>{row.peso_ate_kg}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {row._errors.map((error, i) => (
                              <div key={i} className="text-red-600">{error}</div>
                            ))}
                            {row._warnings.map((warning, i) => (
                              <div key={i} className="text-yellow-600">{warning}</div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {importData.length > 50 && (
                <p className="text-sm text-muted-foreground">
                  Mostrando primeiras 50 linhas de {importData.length}
                </p>
              )}
            </div>
          )}

          {importStep === 'processing' && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg font-semibold">Processando importação...</p>
                <p className="text-muted-foreground">Aguarde enquanto os dados são salvos</p>
              </div>
            </div>
          )}

          {importStep === 'complete' && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Importação concluída!</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResults.inserted}</div>
                  <div className="text-sm text-green-700">Inseridos</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResults.updated}</div>
                  <div className="text-sm text-blue-700">Atualizados</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResults.errors.length}</div>
                  <div className="text-sm text-red-700">Erros</div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="text-center">
                  <Button variant="outline" onClick={downloadErrors}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar CSV de Erros
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {importStep === 'upload' && (
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancelar
              </Button>
            )}
            {importStep === 'preview' && (
              <>
                <Button variant="outline" onClick={() => setImportStep('upload')}>
                  Voltar
                </Button>
                <Button 
                  onClick={processImport}
                  disabled={importData.filter(r => r._status !== 'error').length === 0}
                >
                  Processar Importação
                </Button>
              </>
            )}
            {importStep === 'complete' && (
              <Button onClick={() => {
                setShowImportDialog(false);
                setImportStep('upload');
                setImportData([]);
                setImportFile(null);
              }}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}