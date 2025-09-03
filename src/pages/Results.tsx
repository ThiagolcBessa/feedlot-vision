import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Copy, Share2, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatWeight, formatArroubas, formatPercentage } from '@/services/calculations';
import { toast } from '@/hooks/use-toast';

interface SimulationWithResults {
  id: string;
  title: string;
  created_at: string;
  entry_weight_kg: number;
  days_on_feed: number;
  adg_kg_day: number;
  selling_price_per_at: number;
  notes?: string;
  results?: {
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
  };
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [simulation, setSimulation] = useState<SimulationWithResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchSimulation();
    }
  }, [user, id]);

  const fetchSimulation = async () => {
    if (!user || !id) return;

    try {
      const { data: simulationData, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', id)
        .eq('created_by', user.id)
        .single();

      if (simError) throw simError;

      const { data: results, error: resultError } = await supabase
        .from('simulation_results')
        .select('*')
        .eq('simulation_id', id)
        .single();

      if (resultError && resultError.code !== 'PGRST116') throw resultError;

      setSimulation({
        ...simulationData,
        results: results || undefined
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar resultados",
        description: "Ocorreu um erro ao carregar os resultados da simulação.",
        variant: "destructive",
      });
      navigate('/simulations');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!user || !simulation) return;

    try {
      // Get the full simulation data first
      const { data: fullSimulation, error: fetchError } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simulation.id)
        .single();

      if (fetchError) throw fetchError;

      const { data: copy, error } = await supabase
        .from('simulations')
        .insert({
          ...fullSimulation,
          id: undefined,
          title: `${simulation.title} (Cópia)`,
          created_at: undefined,
          updated_at: undefined,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Simulação duplicada",
        description: "A simulação foi duplicada com sucesso.",
      });

      navigate(`/simulation?edit=${copy.id}`);
    } catch (error) {
      toast({
        title: "Erro ao duplicar",
        description: "Ocorreu um erro ao duplicar a simulação.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMarginStatus = (margin?: number) => {
    if (margin === undefined) return null;
    
    if (margin > 0) {
      return {
        label: 'Simulação Viável',
        color: 'text-green-700 bg-green-100',
        icon: TrendingUp
      };
    } else {
      return {
        label: 'Simulação Inviável',
        color: 'text-red-700 bg-red-100',
        icon: TrendingDown
      };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Carregando resultados...</div>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Simulação não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A simulação solicitada não foi encontrada ou você não tem permissão para visualizá-la.
          </p>
          <Button onClick={() => navigate('/simulations')}>
            Voltar às Simulações
          </Button>
        </div>
      </div>
    );
  }

  const marginStatus = getMarginStatus(simulation.results?.margin_total);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/simulations')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar às Simulações
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{simulation.title}</h1>
              {marginStatus && (
                <Badge variant="secondary" className={marginStatus.color}>
                  <marginStatus.icon className="w-3 h-3 mr-1" />
                  {marginStatus.label}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Criado em {formatDate(simulation.created_at)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {!simulation.results ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Resultados não calculados</h3>
              <p className="text-muted-foreground mb-4">
                Esta simulação ainda não possui resultados calculados.
              </p>
              <Button onClick={() => navigate(`/simulation?edit=${simulation.id}`)}>
                Calcular Resultados
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Margem Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  simulation.results.margin_total >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(simulation.results.margin_total)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Por animal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Spread (R$/@)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  simulation.results.spread_r_per_at >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(simulation.results.spread_r_per_at)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Venda - Custo por @
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Break-even (R$/@)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(simulation.results.break_even_r_per_at)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Preço de equilíbrio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  simulation.results.roi_pct >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(simulation.results.roi_pct)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Retorno sobre investimento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Performance do Animal</CardTitle>
                <CardDescription>
                  Dados de performance e rendimento da simulação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground block">Peso Entrada</span>
                    <span className="text-lg font-semibold">{formatWeight(simulation.entry_weight_kg)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Peso Saída</span>
                    <span className="text-lg font-semibold">{formatWeight(simulation.results.exit_weight_kg)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Peso Carcaça</span>
                    <span className="text-lg font-semibold">{formatWeight(simulation.results.carcass_weight_kg)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Ganho Médio Diário</span>
                    <span className="text-lg font-semibold">{simulation.adg_kg_day} kg/dia</span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground block">Arrobas Gancho</span>
                    <span className="text-lg font-semibold">{formatArroubas(simulation.results.arroubas_hook)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Arrobas Ganho</span>
                    <span className="text-lg font-semibold">{formatArroubas(simulation.results.arroubas_gain)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Dias Confinamento</span>
                    <span className="text-lg font-semibold">{simulation.days_on_feed} dias</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Payback</span>
                    <span className="text-lg font-semibold">
                      {simulation.results.payback_days ? `${simulation.results.payback_days} dias` : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise Financeira</CardTitle>
                <CardDescription>
                  Breakdown detalhado de custos e receitas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Custo por Animal</span>
                    <span className="font-semibold">{formatCurrency(simulation.results.cost_per_animal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Custo por Arroba</span>
                    <span className="font-semibold">{formatCurrency(simulation.results.cost_per_arrouba)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Preço de Venda (@ atual)</span>
                    <span className="font-semibold">{formatCurrency(simulation.selling_price_per_at)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Receita Total</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(simulation.results.arroubas_hook * simulation.selling_price_per_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Custo Total</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(simulation.results.cost_per_animal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold">Margem Líquida</span>
                    <span className={`font-bold text-lg ${
                      simulation.results.margin_total >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(simulation.results.margin_total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information Card */}
          {simulation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {simulation.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}