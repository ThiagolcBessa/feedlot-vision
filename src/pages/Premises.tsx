import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Premises {
  id?: string;
  capacity_head: number;
  fixed_cost_daily_per_head: number;
  admin_overhead_daily_per_head: number;
  default_mortality_pct: number;
  default_reject_pct: number;
}

export default function Premises() {
  const [premises, setPremises] = useState<Premises>({
    capacity_head: 1000,
    fixed_cost_daily_per_head: 0,
    admin_overhead_daily_per_head: 0,
    default_mortality_pct: 2.0,
    default_reject_pct: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadPremises();
  }, []);

  const loadPremises = async () => {
    try {
      const { data, error } = await supabase
        .from('premises')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - create default
          await createDefaultPremises();
        } else {
          throw error;
        }
      } else {
        setPremises(data);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar premissas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPremises = async () => {
    try {
      const { data, error } = await supabase
        .from('premises')
        .insert([{
          capacity_head: 1000,
          fixed_cost_daily_per_head: 0,
          admin_overhead_daily_per_head: 0,
          default_mortality_pct: 2.0,
          default_reject_pct: 1.0,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      setPremises(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar premissas padrão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('premises')
        .upsert({
          ...premises,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Premissas salvas com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar premissas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Premises, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPremises(prev => ({ ...prev, [field]: numValue }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Premissas do Confinamento</h1>
        <p className="text-muted-foreground mt-2">
          Configure as premissas globais do seu confinamento
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Defina os parâmetros padrão para as simulações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade (cabeças)</Label>
              <Input
                id="capacity"
                type="number"
                value={premises.capacity_head}
                onChange={(e) => handleChange('capacity_head', e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortality">Mortalidade Padrão (%)</Label>
              <Input
                id="mortality"
                type="number"
                step="0.1"
                value={premises.default_mortality_pct}
                onChange={(e) => handleChange('default_mortality_pct', e.target.value)}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reject">Rejeitos Padrão (%)</Label>
              <Input
                id="reject"
                type="number"
                step="0.1"
                value={premises.default_reject_pct}
                onChange={(e) => handleChange('default_reject_pct', e.target.value)}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixed_cost">Custo Fixo Diário por Cabeça (R$)</Label>
              <Input
                id="fixed_cost"
                type="number"
                step="0.01"
                value={premises.fixed_cost_daily_per_head}
                onChange={(e) => handleChange('fixed_cost_daily_per_head', e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_overhead">Overhead Administrativo Diário por Cabeça (R$)</Label>
              <Input
                id="admin_overhead"
                type="number"
                step="0.01"
                value={premises.admin_overhead_daily_per_head}
                onChange={(e) => handleChange('admin_overhead_daily_per_head', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Premissas'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}