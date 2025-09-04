import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Eye, Copy, Trash2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage, formatWeight } from '@/services/calculations';

interface Simulation {
  id: string;
  title: string;
  entry_weight_kg: number;
  days_on_feed: number;
  selling_price_per_at: number;
  notes?: string;
  created_at: string;
  results?: {
    margin_total: number;
    spread_r_per_at: number;
    break_even_r_per_at: number;
    roi_pct: number;
  };
}

export default function Simulations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicating, setDuplicating] = useState<string | null>(null);

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
            roi_pct
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(sim => ({
        ...sim,
        results: sim.simulation_results?.[0] || null,
      }));

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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('simulations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSimulations(prev => prev.filter(sim => sim.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Simulação excluída com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir simulação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (simulation: Simulation) => {
    setDuplicating(simulation.id);
    try {
      const { id, created_at, results, ...simData } = simulation;
      
      const { data, error } = await supabase
        .from('simulations')
        .insert({
          ...simData,
          title: `${simulation.title} (Cópia)`,
        } as any)
        .select()
        .single();

      if (error) throw error;

      navigate(`/simulation?id=${data.id}`);
      toast({
        title: 'Sucesso',
        description: 'Simulação duplicada com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao duplicar simulação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDuplicating(null);
    }
  };

  const filteredSimulations = simulations.filter(sim =>
    sim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sim.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMarginColor = (margin?: number) => {
    if (!margin) return 'secondary';
    return margin > 0 ? 'default' : 'destructive';
  };

  const getROIColor = (roi?: number) => {
    if (!roi) return 'secondary';
    if (roi > 15) return 'default';
    if (roi > 5) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Simulações</h1>
          <p className="text-muted-foreground">
            Gerencie suas simulações de viabilidade do confinamento
          </p>
        </div>
        <Button onClick={() => navigate('/simulation')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Simulação
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar simulações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Simulations Grid */}
      {filteredSimulations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                {searchTerm ? 'Nenhuma simulação encontrada' : 'Nenhuma simulação cadastrada'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira simulação de viabilidade'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/simulation')} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira simulação
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSimulations.map((simulation) => (
            <Card key={simulation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg leading-tight">
                      {simulation.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(simulation.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Parameters */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Peso Entrada</div>
                    <div className="font-medium">{simulation.entry_weight_kg} kg</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Dias Cocho</div>
                    <div className="font-medium">{simulation.days_on_feed} dias</div>
                  </div>
                </div>

                {/* Results KPIs */}
                {simulation.results && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">Margem</div>
                        <Badge variant={getMarginColor(simulation.results.margin_total)} className="text-xs">
                          {formatCurrency(simulation.results.margin_total)}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">ROI</div>
                        <Badge variant={getROIColor(simulation.results.roi_pct)} className="text-xs">
                          {formatPercentage(simulation.results.roi_pct)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">Spread</div>
                        <div className="text-xs font-medium">
                          {formatCurrency(simulation.results.spread_r_per_at)}/@
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">Break-even</div>
                        <div className="text-xs font-medium">
                          {formatCurrency(simulation.results.break_even_r_per_at)}/@
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/results/${simulation.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(simulation)}
                    disabled={duplicating === simulation.id}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a simulação "{simulation.title}"?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(simulation.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}