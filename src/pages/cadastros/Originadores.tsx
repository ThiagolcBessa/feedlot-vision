import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  role: string;
  created_at: string;
}

export default function Originadores() {
  const { user, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar originadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (profileId: string, newRole: string) => {
    if (!isAdmin) return;
    
    setUpdating(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, role: newRole } : p
      ));

      toast({
        title: "Sucesso",
        description: `Papel alterado para ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar papel do usuário",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', variant: 'destructive' as const },
      originator: { label: 'Originador', variant: 'default' as const },
      basic: { label: 'Básico', variant: 'secondary' as const },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.basic;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDisplayName = (profile: Profile) => {
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.company_name || 'Nome não informado';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Originadores</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e seus níveis de acesso no sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            {isAdmin ? 'Clique no papel para alterá-lo' : 'Visualização dos usuários cadastrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="font-medium">{getDisplayName(profile)}</div>
                  <div className="text-sm text-muted-foreground">
                    Criado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updating === profile.id}
                        >
                          {getRoleBadge(profile.role)}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alterar Papel do Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <strong>Usuário:</strong> {getDisplayName(profile)}
                          </div>
                          <div>
                            <strong>Papel atual:</strong> {getRoleBadge(profile.role)}
                          </div>
                          
                          <Select
                            defaultValue={profile.role}
                            onValueChange={(value) => updateRole(profile.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Básico</SelectItem>
                              <SelectItem value="originator">Originador</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    getRoleBadge(profile.role)
                  )}
                </div>
              </div>
            ))}

            {profiles.length === 0 && (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
                <p className="text-muted-foreground">
                  Os usuários cadastrados aparecerão aqui
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}