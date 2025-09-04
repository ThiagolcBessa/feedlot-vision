import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Modalidades() {
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModalidades();
  }, []);

  const loadModalidades = async () => {
    try {
      const { data, error } = await supabase
        .from('unit_price_matrix' as any)
        .select('modalidade');

      if (error) throw error;

      // Get unique modalidades
      const uniqueModalidades = [...new Set((data as any[]).map(item => item.modalidade))].filter(Boolean).sort();
      setModalidades(uniqueModalidades);
    } catch (error) {
      console.error('Error loading modalidades:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar modalidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getModalidadeDescription = (modalidade: string) => {
    const descriptions: Record<string, string> = {
      'Diária': 'Cobrança por dia de confinamento por cabeça',
      'Arroba Prod.': 'Cobrança por arroba produzida no período',
    };
    return descriptions[modalidade] || 'Modalidade de cobrança';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modalidades</h1>
        <p className="text-muted-foreground">
          Modalidades de cobrança disponíveis na matriz de preços
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Modalidades
          </CardTitle>
          <CardDescription>
            Modalidades extraídas da matriz de preços das unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {modalidades.map((modalidade) => (
              <div
                key={modalidade}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{modalidade}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getModalidadeDescription(modalidade)}
                  </p>
                </div>
                <Badge variant="outline">Ativo</Badge>
              </div>
            ))}

            {modalidades.length === 0 && !loading && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma modalidade disponível</h3>
                <p className="text-muted-foreground">
                  As modalidades da matriz aparecerão aqui
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}