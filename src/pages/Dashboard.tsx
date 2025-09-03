import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, BarChart3, Database, TrendingUp, DollarSign, Beef, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  activeSimulations: number;
  avgMargin: number;
  avgBreakEven: number;
  avgROI: number;
  totalAnimals: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeSimulations: 0,
    avgMargin: 0,
    avgBreakEven: 0,
    avgROI: 0,
    totalAnimals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    if (!user) return;

    try {
      // Get simulations with results
      const { data: simulations, error } = await supabase
        .from('simulations')
        .select(`
          *,
          simulation_results (*)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (simulations && simulations.length > 0) {
        const simulationsWithResults = simulations.filter(sim => sim.simulation_results?.[0]);
        
        const activeCount = simulationsWithResults.length;
        const totalAnimals = simulations.reduce((sum, sim) => sum + (sim.entry_weight_kg * 10 / 300), 0); // Rough estimate
        
        if (simulationsWithResults.length > 0) {
          const avgMargin = simulationsWithResults.reduce((sum, sim) => 
            sum + (sim.simulation_results[0]?.margin_total || 0), 0) / simulationsWithResults.length;
          
          const avgBreakEven = simulationsWithResults.reduce((sum, sim) => 
            sum + (sim.simulation_results[0]?.break_even_r_per_at || 0), 0) / simulationsWithResults.length;
          
          const avgROI = simulationsWithResults.reduce((sum, sim) => 
            sum + (sim.simulation_results[0]?.roi_pct || 0), 0) / simulationsWithResults.length;

          setStats({
            activeSimulations: activeCount,
            avgMargin,
            avgBreakEven,
            avgROI,
            totalAnimals: Math.round(totalAnimals),
          });
        } else {
          setStats({
            activeSimulations: activeCount,
            avgMargin: 0,
            avgBreakEven: 0,
            avgROI: 0,
            totalAnimals: Math.round(totalAnimals),
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua operação de confinamento
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulações Ativas</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSimulations}</div>
            <p className="text-xs text-muted-foreground">Total de simulações criadas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgMargin)}</div>
            <p className="text-xs text-muted-foreground">Por animal simulado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Break-even Médio</CardTitle>
            <Beef className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgBreakEven)}</div>
            <p className="text-xs text-muted-foreground">R$/@</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgROI.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Simulação
            </CardTitle>
            <CardDescription>
              Configure uma nova simulação de confinamento com diferentes cenários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/simulation">Iniciar Simulação</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ver Simulações
            </CardTitle>
            <CardDescription>
              Visualize e compare suas simulações existentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/simulations">Ver Simulações</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerenciar Registros
            </CardTitle>
            <CardDescription>
              Configure fornecedores, insumos e parâmetros do confinamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/registries">Gerenciar Dados</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Suas últimas simulações</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="w-4 h-12 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats.activeSimulations > 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Você tem {stats.activeSimulations} simulações ativas
              </p>
              <Button asChild variant="outline">
                <Link to="/simulations">Ver Todas</Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhuma simulação encontrada. Crie sua primeira simulação para começar!
              </p>
              <Button asChild>
                <Link to="/simulation">Criar Simulação</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}