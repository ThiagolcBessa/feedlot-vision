import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Copy, Trash2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatPercentage } from '@/services/calculations';
import { toast } from '@/hooks/use-toast';

interface SimulationWithResults {
  id: string;
  title: string;
  created_at: string;
  notes: string;
  results?: {
    margin_total: number;
    spread_r_per_at: number;
    break_even_r_per_at: number;
    roi_pct: number;
  };
}

export default function Simulations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<SimulationWithResults[]>([]);
  const [filteredSimulations, setFilteredSimulations] = useState<SimulationWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchSimulations();
    }
  }, [user]);

  useEffect(() => {
    const filtered = simulations.filter(sim =>
      sim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSimulations(filtered);
  }, [simulations, searchTerm]);

  const fetchSimulations = async () => {
    if (!user) return;

    try {
      const { data: simulationsData, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (simError) throw simError;

      // Fetch results for each simulation
      const simulationsWithResults = await Promise.all(
        simulationsData?.map(async (sim) => {
          const { data: results } = await supabase
            .from('simulation_results')
            .select('margin_total, spread_r_per_at, break_even_r_per_at, roi_pct')
            .eq('simulation_id', sim.id)
            .single();

          return {
            ...sim,
            results: results || undefined
          };
        }) || []
      );

      setSimulations(simulationsWithResults);
    } catch (error) {
      toast({
        title: "Erro ao carregar simulações",
        description: "Ocorreu um erro ao carregar as simulações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (originalId: string) => {
    if (!user) return;

    try {
      // Get original simulation
      const { data: original, error: fetchError } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', originalId)
        .single();

      if (fetchError) throw fetchError;

      // Create copy
      const { data: copy, error: copyError } = await supabase
        .from('simulations')
        .insert({
          ...original,
          id: undefined,
          title: `${original.title} (Cópia)`,
          created_at: undefined,
          updated_at: undefined,
          created_by: user.id,
        })
        .select()
        .single();

      if (copyError) throw copyError;

      toast({
        title: "Simulação duplicada",
        description: "A simulação foi duplicada com sucesso.",
      });

      // Navigate to edit the duplicated simulation
      navigate(`/simulation?edit=${copy.id}`);
    } catch (error) {
      toast({
        title: "Erro ao duplicar",
        description: "Ocorreu um erro ao duplicar a simulação.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta simulação?')) return;

    try {
      const { error } = await supabase
        .from('simulations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Simulação excluída",
        description: "A simulação foi excluída com sucesso.",
      });

      fetchSimulations();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir a simulação.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getMarginBadge = (margin?: number) => {
    if (margin === undefined) return null;
    
    if (margin > 0) {
      return <Badge variant="secondary" className="text-green-700 bg-green-100">
        <TrendingUp className="w-3 h-3 mr-1" />
        Positiva
      </Badge>;
    } else {
      return <Badge variant="secondary" className="text-red-700 bg-red-100">
        <TrendingDown className="w-3 h-3 mr-1" />
        Negativa
      </Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Carregando simulações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Simulações</h1>
          <p className="text-muted-foreground">
            Gerencie suas simulações de viabilidade do confinamento
          </p>
        </div>
        
        <Button asChild>
          <Link to="/simulation">
            <Plus className="w-4 h-4 mr-2" />
            Nova Simulação
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar simulações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredSimulations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {simulations.length === 0 ? 'Nenhuma simulação encontrada' : 'Nenhum resultado encontrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {simulations.length === 0 
                  ? 'Crie sua primeira simulação para começar a analisar a viabilidade do confinamento.'
                  : 'Tente ajustar os termos da busca para encontrar suas simulações.'}
              </p>
              {simulations.length === 0 && (
                <Button asChild>
                  <Link to="/simulation">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Simulação
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSimulations.map((simulation) => (
            <Card key={simulation.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{simulation.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(simulation.created_at)}
                    </div>
                  </div>
                  {getMarginBadge(simulation.results?.margin_total)}
                </div>
                {simulation.notes && (
                  <CardDescription className="text-sm line-clamp-2">
                    {simulation.notes}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                {simulation.results ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Margem</span>
                        <span className={`font-medium ${
                          simulation.results.margin_total >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(simulation.results.margin_total)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">ROI</span>
                        <span className={`font-medium ${
                          simulation.results.roi_pct >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(simulation.results.roi_pct)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Spread</span>
                        <span className="font-medium">
                          {formatCurrency(simulation.results.spread_r_per_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Break-even</span>
                        <span className="font-medium">
                          {formatCurrency(simulation.results.break_even_r_per_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Resultados não calculados
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/results/${simulation.id}`)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(simulation.id)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(simulation.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}