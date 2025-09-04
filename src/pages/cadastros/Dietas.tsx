import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wheat, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Dietas() {
  const [dietas, setDietas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadDietas();
  }, []);

  const loadDietas = async () => {
    try {
      const { data, error } = await supabase
        .from('unit_price_matrix' as any)
        .select('dieta');

      if (error) throw error;

      // Get unique dietas
      const uniqueDietas = [...new Set((data as any[]).map(item => item.dieta))].filter(Boolean).sort();
      setDietas(uniqueDietas);
    } catch (error) {
      console.error('Error loading dietas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dietas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDietas = dietas.filter(dieta => 
    dieta.toLowerCase().includes(search.toLowerCase())
  );

  const getDietaDescription = (dieta: string) => {
    const descriptions: Record<string, string> = {
      'Volumoso': 'Dieta baseada em volumoso (silagem, feno)',
      'Grão': 'Dieta concentrada com alta proporção de grãos',
    };
    return descriptions[dieta] || 'Tipo de dieta nutricional';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dietas</h1>
        <p className="text-muted-foreground">
          Tipos de dieta disponíveis na matriz de preços
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wheat className="h-5 w-5" />
            Lista de Dietas
          </CardTitle>
          <CardDescription>
            Dietas extraídas da matriz de preços das unidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar dietas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4">
            {filteredDietas.map((dieta) => (
              <div
                key={dieta}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wheat className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{dieta}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getDietaDescription(dieta)}
                  </p>
                </div>
                <Badge variant="outline">Ativo</Badge>
              </div>
            ))}

            {filteredDietas.length === 0 && !loading && (
              <div className="text-center py-8">
                <Wheat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {search ? 'Nenhuma dieta encontrada' : 'Nenhuma dieta disponível'}
                </h3>
                <p className="text-muted-foreground">
                  {search 
                    ? 'Tente uma busca diferente' 
                    : 'As dietas da matriz aparecerão aqui'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}