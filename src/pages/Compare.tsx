import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage, formatArroubas } from '@/services/calculations';
import { TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react';

interface SimulationWithResults {
  id: string;
  title: string;
  entry_weight_kg: number;
  days_on_feed: number;
  selling_price_per_at: number;
  created_at: string;
  results?: {
    margin_total: number;
    spread_r_per_at: number;
    break_even_r_per_at: number;
    roi_pct: number;
    payback_days?: number;
    cost_per_animal: number;
    cost_per_arrouba: number;
    arroubas_hook: number;
    exit_weight_kg: number;
  };
}

export default function Compare() {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<SimulationWithResults[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select(`
          *,
          simulation_results (
            margin_total,
            spread_r_per_at,
            break_even_r_per_at,
            roi_pct,
            payback_days,
            cost_per_animal,
            cost_per_arrouba,
            arroubas_hook,
            exit_weight_kg
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data
        .map(sim => ({
          ...sim,
          results: sim.simulation_results?.[0] || null,
        }))
        .filter(sim => sim.results); // Only simulations with results

      setSimulations(formattedData);
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

  const selectedSimulations = simulations.filter(sim => selectedIds.includes(sim.id));

  const handleSelectionChange = (simulationId: string, isSelected: boolean) => {
    if (isSelected && selectedIds.length < 3) {
      setSelectedIds([...selectedIds, simulationId]);
    } else if (!isSelected) {
      setSelectedIds(selectedIds.filter(id => id !== simulationId));
    }
  };

  const getComparisonData = () => {
    return selectedSimulations.map(sim => ({
      name: sim.title.length > 15 ? sim.title.substring(0, 15) + '...' : sim.title,
      fullName: sim.title,
      margin: sim.results?.margin_total || 0,
      cost_per_animal: sim.results?.cost_per_animal || 0,
      cost_per_arrouba: sim.results?.cost_per_arrouba || 0,
      roi: sim.results?.roi_pct || 0,
      spread: sim.results?.spread_r_per_at || 0,
    }));
  };

  const getBestPerformer = (metric: string) => {
    if (selectedSimulations.length === 0) return null;
    
    return selectedSimulations.reduce((best, current) => {
      const currentValue = current.results?.[metric as keyof typeof current.results] || 0;
      const bestValue = best.results?.[metric as keyof typeof best.results] || 0;
      return currentValue > bestValue ? current : best;
    });
  };

  const getWorstPerformer = (metric: string) => {
    if (selectedSimulations.length === 0) return null;
    
    return selectedSimulations.reduce((worst, current) => {
      const currentValue = current.results?.[metric as keyof typeof current.results] || 0;
      const worstValue = worst.results?.[metric as keyof typeof worst.results] || 0;
      return currentValue < worstValue ? current : worst;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
          <div className="lg:col-span-2 h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comparar Simulações</h1>
        <p className="text-muted-foreground">
          Compare até 3 simulações lado a lado para avaliar diferentes cenários
        </p>
      </div>

      {simulations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma simulação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Você precisa ter simulações salvas com resultados calculados para usar a comparação
            </p>
            <Button onClick={() => window.location.href = '/simulation'}>
              Criar Nova Simulação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Selection Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Selecionar Simulações
                </CardTitle>
                <CardDescription>
                  Escolha até 3 simulações para comparar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {simulations.map((simulation) => (
                  <div
                    key={simulation.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedIds.includes(simulation.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectionChange(
                      simulation.id, 
                      !selectedIds.includes(simulation.id)
                    )}
                  >
                    <div className="font-medium text-sm leading-tight">
                      {simulation.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(simulation.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span>Margem:</span>
                      <span className={simulation.results?.margin_total > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(simulation.results?.margin_total || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedIds.length > 0 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                  size="sm"
                >
                  Limpar Seleção
                </Button>
              </div>
            )}
          </div>

          {/* Comparison Results */}
          <div className="lg:col-span-3 space-y-6">
            {selectedSimulations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Selecione simulações para comparar</h3>
                  <p className="text-muted-foreground">
                    Escolha 2 ou 3 simulações no painel ao lado para ver a comparação
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* KPI Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedSimulations.map((simulation, index) => (
                    <Card key={simulation.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm leading-tight">
                          {simulation.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {simulation.entry_weight_kg}kg | {simulation.days_on_feed}d
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(simulation.results?.margin_total || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">Margem</div>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>ROI:</span>
                            <Badge variant={simulation.results?.roi_pct > 15 ? 'default' : 'secondary'} className="text-xs">
                              {formatPercentage(simulation.results?.roi_pct || 0)}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Spread:</span>
                            <span>{formatCurrency(simulation.results?.spread_r_per_at || 0)}/@</span>
                          </div>
                          <div className="flex justify-between">
                            <span>B.E.:</span>
                            <span>{formatCurrency(simulation.results?.break_even_r_per_at || 0)}/@</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Performance Insights */}
                {selectedSimulations.length >= 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Melhor Margem
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const best = getBestPerformer('margin_total');
                          return best ? (
                            <div>
                              <div className="font-medium text-sm">{best.title}</div>
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(best.results?.margin_total || 0)}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          Melhor ROI
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const best = getBestPerformer('roi_pct');
                          return best ? (
                            <div>
                              <div className="font-medium text-sm">{best.title}</div>
                              <div className="text-lg font-bold text-blue-600">
                                {formatPercentage(best.results?.roi_pct || 0)}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-orange-600" />
                          Menor Break-even
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const best = selectedSimulations.reduce((lowest, current) => {
                            const currentBE = current.results?.break_even_r_per_at || Infinity;
                            const lowestBE = lowest.results?.break_even_r_per_at || Infinity;
                            return currentBE < lowestBE ? current : lowest;
                          });
                          return (
                            <div>
                              <div className="font-medium text-sm">{best.title}</div>
                              <div className="text-lg font-bold text-orange-600">
                                {formatCurrency(best.results?.break_even_r_per_at || 0)}/@
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Comparison Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Margem vs ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getComparisonData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(label, payload) => {
                              const item = payload?.[0]?.payload;
                              return item?.fullName || label;
                            }}
                            formatter={(value, name) => {
                              if (name === 'margin') return [formatCurrency(value as number), 'Margem'];
                              if (name === 'roi') return [`${(value as number).toFixed(1)}%`, 'ROI'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="margin" fill="#22c55e" name="Margem (R$)" />
                          <Bar dataKey="roi" fill="#3b82f6" name="ROI (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Receita vs Custo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getComparisonData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(label, payload) => {
                              const item = payload?.[0]?.payload;
                              return item?.fullName || label;
                            }}
                            formatter={(value, name) => {
                              if (name === 'revenue') return [formatCurrency(value as number), 'Receita'];
                              if (name === 'cost') return [formatCurrency(value as number), 'Custo'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="revenue" fill="#22c55e" name="Receita" />
                          <Bar dataKey="cost" fill="#ef4444" name="Custo" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}