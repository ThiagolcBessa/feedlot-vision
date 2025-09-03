import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Copy, 
  Download, 
  Share,
  TrendingUp,
  TrendingDown,
  Calculator,
  DollarSign,
  Target,
  BarChart3,
  Percent
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatPercentage, formatWeight, formatArroubas } from '@/services/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SimulationWithResults {
  id: string;
  title: string;
  created_at: string;
  notes?: string;
  entry_weight_kg: number;
  days_on_feed: number;
  adg_kg_day: number;
  dmi_pct_bw?: number;
  selling_price_per_at: number;
  feed_cost_kg_dm: number;
  simulation_results?: {
    exit_weight_kg: number;
    carcass_weight_kg: number;
    arroubas_hook: number;
    arroubas_gain: number;
    cost_per_animal: number;
    cost_per_arrouba: number;
    margin_total: number;
    spread_r_per_at: number;
    break_even_r_per_at: number;
    roi_pct: number;
    payback_days: number | null;
  }[];
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState<SimulationWithResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSimulation(id);
    }
  }, [id]);

  const fetchSimulation = async (simulationId: string) => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select(`
          *,
          simulation_results (*)
        `)
        .eq('id', simulationId)
        .single();

      if (error) throw error;
      setSimulation(data);
    } catch (error) {
      console.error('Error fetching simulation:', error);
      toast({
        title: "Simulação não encontrada",
        description: "A simulação solicitada não foi encontrada.",
        variant: "destructive",
      });
      navigate('/simulations');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!simulation) return;

    try {
      const { data, error } = await supabase
        .from('simulations')
        .insert({
          title: `${simulation.title} (Cópia)`,
          entry_weight_kg: simulation.entry_weight_kg,
          days_on_feed: simulation.days_on_feed,
          adg_kg_day: simulation.adg_kg_day,
          dmi_pct_bw: simulation.dmi_pct_bw,
          selling_price_per_at: simulation.selling_price_per_at,
          feed_cost_kg_dm: simulation.feed_cost_kg_dm,
          notes: simulation.notes,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Simulação duplicada",
        description: "A simulação foi duplicada com sucesso.",
      });

      navigate(`/simulation?edit=${data.id}`);
    } catch (error) {
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar a simulação.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMarginStatus = (margin: number) => {
    if (margin > 0) {
      return {
        label: "Positiva",
        color: "bg-green-500",
        icon: TrendingUp,
      };
    } else {
      return {
        label: "Negativa", 
        color: "bg-red-500",
        icon: TrendingDown,
      };
    }
  };

  // Generate weight curve data
  const generateWeightCurveData = () => {
    if (!simulation) return [];
    
    const data = [];
    const dailyGain = simulation.adg_kg_day;
    const startWeight = simulation.entry_weight_kg;
    const days = simulation.days_on_feed;

    for (let day = 0; day <= days; day += 10) {
      data.push({
        day,
        weight: startWeight + (dailyGain * day),
      });
    }

    return data;
  };

  // Generate sensitivity analysis data
  const generateSensitivityData = () => {
    if (!simulation || !simulation.simulation_results?.[0]) return [];

    const baseMargin = simulation.simulation_results[0].margin_total;
    const baseSellingPrice = simulation.selling_price_per_at;
    const baseFeedCost = simulation.feed_cost_kg_dm;

    return [
      { scenario: 'Venda -10%', margin: baseMargin - (baseMargin * 0.15) },
      { scenario: 'Venda -5%', margin: baseMargin - (baseMargin * 0.08) },
      { scenario: 'Base', margin: baseMargin },
      { scenario: 'Venda +5%', margin: baseMargin + (baseMargin * 0.08) },
      { scenario: 'Venda +10%', margin: baseMargin + (baseMargin * 0.15) },
    ];
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Simulação não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              A simulação solicitada não foi encontrada ou foi removida.
            </p>
            <Button asChild>
              <Link to="/simulations">Voltar às Simulações</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = simulation.simulation_results?.[0];
  const marginStatus = result ? getMarginStatus(result.margin_total) : null;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{simulation.title}</h1>
          <p className="text-muted-foreground">
            Criado em {formatDate(simulation.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Share className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {result ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Margem Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${result.margin_total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(result.margin_total)}
                </div>
                {marginStatus && (
                  <Badge variant="secondary" className="mt-2">
                    <marginStatus.icon className="w-3 h-3 mr-1" />
                    {marginStatus.label}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spread</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(result.spread_r_per_at)}</div>
                <p className="text-xs text-muted-foreground">R$/@</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Break-even</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(result.break_even_r_per_at)}</div>
                <p className="text-xs text-muted-foreground">R$/@</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(result.roi_pct)}</div>
                <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payback</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {result.payback_days ? `${result.payback_days} dias` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Tempo de retorno</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho dos Animais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Peso Entrada</p>
                    <p className="text-lg font-semibold">{formatWeight(simulation.entry_weight_kg)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Peso Saída</p>
                    <p className="text-lg font-semibold">{formatWeight(result.exit_weight_kg)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Peso Carcaça</p>
                    <p className="text-lg font-semibold">{formatWeight(result.carcass_weight_kg)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">GMD</p>
                    <p className="text-lg font-semibold">{formatWeight(simulation.adg_kg_day)}/dia</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">@ Ganho</p>
                    <p className="text-lg font-semibold">{formatArroubas(result.arroubas_gain)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dias Confinamento</p>
                    <p className="text-lg font-semibold">{simulation.days_on_feed} dias</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise Financeira</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Custo por Animal</p>
                    <p className="text-lg font-semibold">{formatCurrency(result.cost_per_animal)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Custo por @</p>
                    <p className="text-lg font-semibold">{formatCurrency(result.cost_per_arrouba)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">@ Gancho</p>
                    <p className="text-lg font-semibold">{formatArroubas(result.arroubas_hook)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Preço Venda</p>
                    <p className="text-lg font-semibold">{formatCurrency(simulation.selling_price_per_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Curva de Peso</CardTitle>
                <CardDescription>Evolução do peso ao longo do confinamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateWeightCurveData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Peso']} />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Sensibilidade</CardTitle>
                <CardDescription>Impacto de variações no preço de venda</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateSensitivityData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Margem']} />
                    <Bar dataKey="margin" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {simulation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{simulation.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Resultados não disponíveis</h2>
            <p className="text-muted-foreground mb-4">
              Esta simulação não possui resultados calculados.
            </p>
            <Button asChild>
              <Link to={`/simulation?edit=${simulation.id}`}>Recalcular</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}