import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Cat, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function TiposAnimal() {
  const [tipos, setTipos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTipos();
  }, []);

  const loadTipos = async () => {
    try {
      // Direct query to matrix table
      const { data, error } = await supabase
        .from('unit_price_matrix' as any)
        .select('tipo_animal');
      
      if (error) throw error;
      
      // Get unique types
      const uniqueTipos = [...new Set((data as any[]).map(item => item.tipo_animal))].filter(Boolean).sort();
      setTipos(uniqueTipos);
    } catch (error) {
      console.error('Error loading tipos animal:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de animal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTipos = tipos.filter(tipo => 
    tipo.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tipos de Animal</h1>
        <p className="text-muted-foreground">
          Tipos de animal disponíveis na matriz de preços
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cat className="h-5 w-5" />
            Lista de Tipos
          </CardTitle>
          <CardDescription>
            Tipos extraídos da matriz de preços das unidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tipos de animal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-2">
            {filteredTipos.map((tipo) => (
              <div
                key={tipo}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Cat className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{tipo}</span>
                </div>
                <Badge variant="outline">Ativo</Badge>
              </div>
            ))}

            {filteredTipos.length === 0 && !loading && (
              <div className="text-center py-8">
                <Cat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {search ? 'Nenhum tipo encontrado' : 'Nenhum tipo disponível'}
                </h3>
                <p className="text-muted-foreground">
                  {search 
                    ? 'Tente uma busca diferente' 
                    : 'Os tipos de animal da matriz aparecerão aqui'
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