import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useTableCRUD(tableName: 'inputs' | 'suppliers' | 'clients' | 'premises') {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(result || []);

      // Create seed data for inputs if table is empty
      if (tableName === 'inputs' && (!result || result.length === 0)) {
        await createSeedInputs();
      }
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      toast({
        title: "Erro ao carregar dados",
        description: `Não foi possível carregar os dados de ${tableName}.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSeedInputs = async () => {
    try {
      // Use direct insert with triggers handling created_by
      const { error: insertError } = await supabase
        .from('inputs')
        .insert([
          { name: 'Milho', unit: 'kg', price: 0.42, vendor: 'Fornecedor Padrão', notes: 'Grão básico para ração' },
          { name: 'Ração Confinamento', unit: 'kg', price: 0.85, vendor: 'Fornecedor Padrão', notes: 'Ração completa para engorda' },
          { name: 'Suplemento Mineral', unit: 'kg', price: 2.50, vendor: 'Fornecedor Padrão', notes: 'Suplementação mineral' },
          { name: 'Medicamentos', unit: 'cabeça', price: 45.00, vendor: 'Fornecedor Padrão', notes: 'Custos veterinários médios' },
          { name: 'Transporte', unit: 'cabeça', price: 25.00, vendor: 'Fornecedor Padrão', notes: 'Frete médio por animal' }
        ] as any[]);
      
      if (insertError) throw insertError;
      
      // Reload data to show the new seed inputs
      const { data: newData } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (newData) {
        setData(newData);
      }
    } catch (error) {
      console.error('Error creating seed inputs:', error);
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
  }, [tableName, user]);

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