import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { useTableCRUD } from '@/hooks/useTableCRUD';
import { DataTable } from '@/components/DataTable';

export default function Unidades() {
  const { isAdmin } = useAuth();
  const { data, loading, create, update, remove: deleteItem } = useTableCRUD('units' as any);

  const columns = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'state', label: 'Estado' },
  ];

  const formFields = [
    { key: 'code', label: 'Código', type: 'text', required: true },
    { key: 'name', label: 'Nome', type: 'text', required: true },
    { key: 'state', label: 'Estado', type: 'text', required: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unidades</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Gerencie as unidades de confinamento' : 'Visualize as unidades disponíveis'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Unidades de Confinamento
          </CardTitle>
          <CardDescription>
            Lista das unidades cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data}
            columns={columns}
            loading={loading}
            error={null}
            onCreate={isAdmin ? create : undefined}
            onUpdate={isAdmin ? update : undefined}
            onDelete={isAdmin ? deleteItem : undefined}
            formFields={formFields}
            searchPlaceholder="Buscar unidades..."
            searchField="name"
            emptyTitle="Nenhuma unidade cadastrada"
            emptyDescription="As unidades de confinamento aparecerão aqui"
          />
        </CardContent>
      </Card>
    </div>
  );
}