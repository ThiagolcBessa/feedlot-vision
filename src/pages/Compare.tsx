import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage, formatArroubas } from '@/services/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';

interface Simulation {
  id: string;
  title: string;
  created_at: string;
}

interface SimulationResult {
  simulation_id: string;
  margin_total: number;
  spread_r_per_at: number;
  break_even_r_per_at: number;
  roi_pct: number;
  payback_days: number | null;
  arroubas_hook: number;
  cost_per_arrouba: number;
  exit_weight_kg: number;
}

interface ComparisonData {
  simulation: Simulation;
  result: SimulationResult;
}

export default function Compare() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSimulations(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar simulações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (simulationId: string, checked: boolean) => {
    setSelectedIds(prev => {
      if (checked) {
        if (prev.length >= 3) {
          toast({
            title: 'Limite atingido',
            description: 'Você pode comparar no máximo 3 simulações',
            variant: 'destructive',
          });
          return prev;
        }
        return [...prev, simulationId];
      } else {
        return prev.filter(id => id !== simulationId);
      }
    });
  };

  const loadComparison = async () => {
    if (selectedIds.length < 2) {
      toast({
        title: 'Seleção insuficiente',
        description: 'Selecione pelo menos 2 simulações para comparar',
        variant: 'destructive',
      });
      return;
    }

    try {
      setComparing(true);

      // Load simulation details and results
      const { data: simulationsData, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .in('id', selectedIds);

      const { data: resultsData, error: resultError } = await supabase
        .from('simulation_results')
        .select('*')
        .in('simulation_id', selectedIds);

      if (simError) throw simError;
      if (resultError) throw resultError;

      // Combine data
      const comparison: ComparisonData[] = selectedIds.map(id => {
        const simulation = simulationsData?.find(s => s.id === id);
        const result = resultsData?.find(r => r.simulation_id === id);
        
        if (!simulation || !result) {
          throw new Error(`Dados incompletos para simulação ${id}`);
        }

        return { simulation, result };
      });

      setComparisonData(comparison);
    } catch (error: any) {
      toast({
        title: 'Erro na comparação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setComparing(false);
    }
  };

  const prepareChartData = () => {
    return comparisonData.map((item, index) => ({
      name: `Sim ${index + 1}`,
      fullName: item.simulation.title,
      margin: item.result.margin_total,
      spread: item.result.spread_r_per_at,
      breakEven: item.result.break_even_r_per_at,
      roi: item.result.roi_pct,
      costPerArrouba: item.result.cost_per_arrouba,
    }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-full bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comparação de Simulações</h1>
        <p className="text-muted-foreground mt-2">
          Compare até 3 simulações lado a lado
        </p>
      </div>

      {/* Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Selecionar Simulações</CardTitle>
              <CardDescription>
                Escolha 2-3 simulações para comparar ({selectedIds.length}/3 selecionadas)
              </CardDescription>
            </div>
            <Button 
              onClick={loadComparison}
              disabled={selectedIds.length < 2 || comparing}
            >
              {comparing ? 'Comparando...' : 'Comparar Selecionadas'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulations.map((simulation) => (
              <div
                key={simulation.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedIds.includes(simulation.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSelectionChange(
                  simulation.id, 
                  !selectedIds.includes(simulation.id)
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.includes(simulation.id)}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{simulation.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(simulation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonData.length > 0 && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonData.map((item, index) => (
              <Card key={item.simulation.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.simulation.title}</CardTitle>
                  <CardDescription>
                    Simulação {index + 1}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Margem Total:</span>
                    <Badge variant={item.result.margin_total >= 0 ? 'default' : 'destructive'}>
                      {formatCurrency(item.result.margin_total)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Spread:</span>
                    <span className="font-medium">{formatCurrency(item.result.spread_r_per_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Break-even:</span>
                    <span className="font-medium">{formatCurrency(item.result.break_even_r_per_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ROI:</span>
                    <Badge variant={item.result.roi_pct >= 0 ? 'default' : 'destructive'}>
                      {formatPercentage(item.result.roi_pct)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Payback:</span>
                    <span className="font-medium">
                      {item.result.payback_days ? `${item.result.payback_days} dias` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">@ Hook:</span>
                    <span className="font-medium">{formatArroubas(item.result.arroubas_hook)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Margin Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Margens</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value), 
                        name === 'margin' ? 'Margem Total' : name
                      ]}
                      labelFormatter={(label: string) => {
                        const item = prepareChartData().find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="margin" fill="hsl(var(--primary))" name="Margem Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ROI Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
                      labelFormatter={(label: string) => {
                        const item = prepareChartData().find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="roi" fill="hsl(var(--secondary))" name="ROI %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Custo por Arroba</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Custo/@']}
                      labelFormatter={(label: string) => {
                        const item = prepareChartData().find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="costPerArrouba" fill="hsl(var(--accent))" name="Custo por @" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Spread & Break-even */}
            <Card>
              <CardHeader>
                <CardTitle>Spread vs Break-even</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value), 
                        name === 'spread' ? 'Spread' : 'Break-even'
                      ]}
                      labelFormatter={(label: string) => {
                        const item = prepareChartData().find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="spread" fill="hsl(var(--primary))" name="Spread" />
                    <Bar dataKey="breakEven" fill="hsl(var(--destructive))" name="Break-even" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}