import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Building2, Users, DollarSign, Settings, Percent } from 'lucide-react';
import { ValidatedInput } from '@/components/ValidatedInput';
import { validateRequired } from '@/utils/validation';

interface PremisesData {
  id?: string;
  capacity_head: number;
  fixed_cost_daily_per_head: number;
  admin_overhead_daily_per_head: number;
  default_mortality_pct: number;
  default_reject_pct: number;
  carcass_yield_pct: number;
}

export default function Premises() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [premises, setPremises] = useState<PremisesData>({
    capacity_head: 1000,
    fixed_cost_daily_per_head: 0,
    admin_overhead_daily_per_head: 0,
    default_mortality_pct: 2.0,
    default_reject_pct: 1.0,
    carcass_yield_pct: 53.0,
  });

  useEffect(() => {
    loadPremises();
  }, []);

  const loadPremises = async () => {
    try {
      const { data, error } = await supabase
        .from('premises')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPremises({
          ...data,
          carcass_yield_pct: data.carcass_yield_pct || 53.0,
        });
      } else {
        // No premises found, create default
        await createDefaultPremises();
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar configurações',
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
        .insert([premises] as any)
        .select()
        .single();

      if (error) throw error;
      setPremises(data);
      
      toast({
        title: 'Configurações criadas',
        description: 'Configurações padrão foram criadas com sucesso',
      });
    } catch (error: any) {
      console.error('Error creating default premises:', error);
      toast({
        title: 'Erro ao criar configurações padrão',
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
          id: premises.id,
        } as any);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
      <div>
        <h1 className="text-3xl font-bold">Configurações do Confinamento</h1>
        <p className="text-muted-foreground">
          Configure os parâmetros gerais do seu confinamento
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Capacidade
            </CardTitle>
            <CardDescription>
              Capacidade máxima do confinamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ValidatedInput
              id="capacity"
              label="Cabeças"
              type="number"
              value={premises.capacity_head}
              onChange={(e) => setPremises({ ...premises, capacity_head: Number(e.target.value) })}
              validation={validateRequired(premises.capacity_head)}
              unit="cabeças"
              min={1}
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Custos Fixos
            </CardTitle>
            <CardDescription>
              Custos operacionais diários por cabeça
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ValidatedInput
              id="fixed_cost"
              label="Custo Fixo Diário"
              type="number"
              step="0.01"
              value={premises.fixed_cost_daily_per_head}
              onChange={(e) => setPremises({ ...premises, fixed_cost_daily_per_head: Number(e.target.value) })}
              unit="R$/cabeça/dia"
              min={0}
              helpText="Infraestrutura, mão de obra, equipamentos"
            />
            <ValidatedInput
              id="admin_overhead"
              label="Overhead Administrativo"
              type="number"
              step="0.01"
              value={premises.admin_overhead_daily_per_head}
              onChange={(e) => setPremises({ ...premises, admin_overhead_daily_per_head: Number(e.target.value) })}
              unit="R$/cabeça/dia"
              min={0}
              helpText="Gestão, escritório, consultoria"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Parâmetros Padrão
            </CardTitle>
            <CardDescription>
              Configurações padrão para simulações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ValidatedInput
              id="mortality"
              label="Mortalidade"
              type="number"
              step="0.1"
              value={premises.default_mortality_pct}
              onChange={(e) => setPremises({ ...premises, default_mortality_pct: Number(e.target.value) })}
              unit="%"
              min={0}
              max={100}
              helpText="Taxa de mortalidade esperada"
            />
            <ValidatedInput
              id="reject"
              label="Refugo"
              type="number"
              step="0.1"
              value={premises.default_reject_pct}
              onChange={(e) => setPremises({ ...premises, default_reject_pct: Number(e.target.value) })}
              unit="%"
              min={0}
              max={100}
              helpText="Taxa de refugo/descarte"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Rendimento
            </CardTitle>
            <CardDescription>
              Parâmetros de carcaça e rendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ValidatedInput
              id="carcass_yield"
              label="Rendimento de Carcaça"
              type="number"
              step="0.1"
              value={premises.carcass_yield_pct}
              onChange={(e) => setPremises({ ...premises, carcass_yield_pct: Number(e.target.value) })}
              unit="%"
              min={40}
              max={65}
              helpText="Rendimento médio de carcaça (padrão: 53%)"
              required
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}