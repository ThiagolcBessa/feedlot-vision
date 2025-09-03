import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Helper function to get typed table operations
export function useTableCRUD(tableName: 'inputs' | 'suppliers' | 'clients' | 'premises') {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new record
  const create = async (values: any) => {
    try {
      setCreating(true);
      const { data: result, error } = await supabase
        .from(tableName as any)
        .insert([values])
        .select()
        .single();

      if (error) throw error;
      
      setData(prev => [result, ...prev]);
      toast({
        title: 'Sucesso',
        description: 'Registro criado com sucesso!',
      });
      return result;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar registro',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  // Update record
  const update = async (id: string, values: any) => {
    try {
      setUpdating(true);
      const { data: result, error } = await supabase
        .from(tableName as any)
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => prev.map(item => 
        item.id === id ? result : item
      ));
      toast({
        title: 'Sucesso',
        description: 'Registro atualizado com sucesso!',
      });
      return result;
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar registro',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  // Delete record
  const remove = async (id: string) => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Registro deletado com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar registro',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tableName]);

  return {
    data,
    loading,
    creating,
    updating,
    deleting,
    create,
    update,
    remove,
    reload: loadData,
  };
}