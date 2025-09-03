import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, Users } from 'lucide-react';
import { useTableCRUD } from '@/hooks/useTableCRUD';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/services/calculations';

// Inputs Tab Component
function InputsTab() {
  const { data, loading, create, update, remove: deleteItem } = useTableCRUD('inputs');
  
  const createSeedInputs = async () => {
    // Create seed data for inputs
    const seedInputs = [
      { name: 'Milho', unit: 'kg', price: 0.42, vendor: 'Fornecedor Padrão', notes: 'Grão básico para ração' },
      { name: 'Ração Confinamento', unit: 'kg', price: 0.85, vendor: 'Fornecedor Padrão', notes: 'Ração completa para engorda' },
      { name: 'Suplemento Mineral', unit: 'kg', price: 2.50, vendor: 'Fornecedor Padrão', notes: 'Suplementação mineral' },
    ];
    
    for (const input of seedInputs) {
      await create(input);
    }
  };

  const columns = [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'unit', label: 'Unidade' },
    { 
      key: 'price', 
      label: 'Preço',
      render: (value: number) => formatCurrency(value)
    },
    { key: 'vendor', label: 'Fornecedor' },
    { key: 'notes', label: 'Observações' },
  ];

  const formFields = [
    { key: 'name', label: 'Nome', type: 'text', required: true },
    { key: 'unit', label: 'Unidade', type: 'text', required: true, placeholder: 'kg, ton, litro...' },
    { key: 'price', label: 'Preço', type: 'number', step: '0.01', required: true },
    { key: 'vendor', label: 'Fornecedor', type: 'text' },
    { key: 'notes', label: 'Observações', type: 'textarea' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Insumos
            </CardTitle>
            <CardDescription>
              Gerencie os insumos utilizados no confinamento
            </CardDescription>
          </div>
          {data.length === 0 && (
            <Button onClick={createSeedInputs} variant="outline">
              Criar Dados Exemplo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          error={null}
          onCreate={create}
          onUpdate={update}
          onDelete={deleteItem}
          formFields={formFields}
          searchPlaceholder="Buscar insumos..."
          searchField="name"
          emptyTitle="Nenhum insumo cadastrado"
          emptyDescription="Comece cadastrando os insumos utilizados no seu confinamento"
        />
      </CardContent>
    </Card>
  );
}

// Suppliers Tab Component
function SuppliersTab() {
  const { data, loading, create, update, remove: deleteItem } = useTableCRUD('suppliers');

  const columns = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone' },
    { 
      key: 'location', 
      label: 'Localização',
      render: (_: any, row: any) => row.city && row.state ? `${row.city}, ${row.state}` : '-'
    },
  ];

  const formFields = [
    { key: 'code', label: 'Código', type: 'text', required: true },
    { key: 'name', label: 'Nome', type: 'text', required: true },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'phone', label: 'Telefone', type: 'tel' },
    { key: 'city', label: 'Cidade', type: 'text' },
    { key: 'state', label: 'Estado', type: 'text' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Fornecedores
        </CardTitle>
        <CardDescription>
          Gerencie seus fornecedores de insumos e serviços
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          error={null}
          onCreate={create}
          onUpdate={update}
          onDelete={deleteItem}
          formFields={formFields}
          searchPlaceholder="Buscar fornecedores..."
          searchField="name"
          emptyTitle="Nenhum fornecedor cadastrado"
          emptyDescription="Cadastre seus fornecedores para facilitar o controle de compras"
        />
      </CardContent>
    </Card>
  );
}

// Clients Tab Component
function ClientsTab() {
  const { data, loading, create, update, remove: deleteItem } = useTableCRUD('clients');

  const columns = [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone' },
  ];

  const formFields = [
    { key: 'name', label: 'Nome', type: 'text', required: true },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'phone', label: 'Telefone', type: 'tel' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Clientes
        </CardTitle>
        <CardDescription>
          Gerencie seus clientes e compradores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          error={null}
          onCreate={create}
          onUpdate={update}
          onDelete={deleteItem}
          formFields={formFields}
          searchPlaceholder="Buscar clientes..."
          searchField="name"
          emptyTitle="Nenhum cliente cadastrado"
          emptyDescription="Cadastre seus clientes para facilitar o controle de vendas"
        />
      </CardContent>
    </Card>
  );
}

export default function Registries() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastros</h1>
        <p className="text-muted-foreground">
          Gerencie insumos, fornecedores e clientes do seu confinamento
        </p>
      </div>

      <Tabs defaultValue="inputs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inputs" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Insumos
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inputs">
          <InputsTab />
        </TabsContent>

        <TabsContent value="suppliers">
          <SuppliersTab />
        </TabsContent>

        <TabsContent value="clients">
          <ClientsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}