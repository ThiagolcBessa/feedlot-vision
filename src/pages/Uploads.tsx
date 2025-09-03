import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ParsedData {
  headers: string[];
  rows: any[][];
}

interface UploadHistory {
  id: string;
  filename: string;
  size: number;
  created_at: string;
}

export default function Uploads() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      
      // Simple CSV parsing (for demonstration)
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1, 201).map(line => // Limit to 200 rows for preview
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      setParsedData({ headers, rows });
      
      // Initialize column mappings
      const mappings: Record<string, string> = {};
      headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('nome') || lowerHeader.includes('name')) {
          mappings[`col_${index}`] = 'name';
        } else if (lowerHeader.includes('unidade') || lowerHeader.includes('unit')) {
          mappings[`col_${index}`] = 'unit';
        } else if (lowerHeader.includes('preço') || lowerHeader.includes('price') || lowerHeader.includes('valor')) {
          mappings[`col_${index}`] = 'price';
        } else if (lowerHeader.includes('fornecedor') || lowerHeader.includes('vendor')) {
          mappings[`col_${index}`] = 'vendor';
        }
      });
      setColumnMappings(mappings);
      
    } catch (error: any) {
      toast({
        title: 'Erro ao processar arquivo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const uploadToStorage = async () => {
    if (!file) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast({
        title: 'Sucesso',
        description: 'Arquivo enviado com sucesso!',
      });

      // Add to history
      setUploadHistory(prev => [{
        id: filePath,
        filename: file.name,
        size: file.size,
        created_at: new Date().toISOString(),
      }, ...prev]);

    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const importToDatabase = async () => {
    if (!parsedData || !parsedData.rows.length) return;

    try {
      setUploading(true);
      
      // Transform data based on mappings
      const inputsToInsert = parsedData.rows
        .filter(row => row.some(cell => cell)) // Filter empty rows
        .map(row => {
          const input: any = { created_by: user?.id };
          
          Object.entries(columnMappings).forEach(([colKey, field]) => {
            const colIndex = parseInt(colKey.split('_')[1]);
            const value = row[colIndex];
            
            if (field === 'price') {
              input[field] = parseFloat(value) || 0;
            } else if (field && value) {
              input[field] = value;
            }
          });
          
          // Ensure required fields
          if (!input.name) input.name = 'Insumo Importado';
          if (!input.unit) input.unit = 'unidade';
          if (!input.price) input.price = 0;
          
          return input;
        })
        .filter(input => input.name); // Filter invalid records

      if (inputsToInsert.length === 0) {
        throw new Error('Nenhum registro válido encontrado');
      }

      const { error } = await supabase
        .from('inputs')
        .insert(inputsToInsert);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${inputsToInsert.length} insumos importados com sucesso!`,
      });

      // Reset form
      setFile(null);
      setParsedData(null);
      setColumnMappings({});

    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importação de Dados</h1>
        <p className="text-muted-foreground mt-2">
          Importe planilhas CSV/XLSX para adicionar dados em lote
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>
              Selecione um arquivo CSV ou XLSX para importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tamanho: {formatFileSize(file.size)}
                </p>
              </div>
            )}

            {file && (
              <div className="flex gap-2">
                <Button 
                  onClick={uploadToStorage}
                  disabled={uploading}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Salvar no Storage'}
                </Button>
                {parsedData && (
                  <Button 
                    onClick={importToDatabase}
                    disabled={uploading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {uploading ? 'Importando...' : 'Importar para BD'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Uploads</CardTitle>
            <CardDescription>
              Arquivos enviados recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadHistory.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum arquivo enviado ainda
              </div>
            ) : (
              <div className="space-y-2">
                {uploadHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{item.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(item.size)} • {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview and Mapping */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview e Mapeamento</CardTitle>
            <CardDescription>
              Primeira visualização dos dados. Mapeie as colunas para os campos corretos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Column Mappings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              {parsedData.headers.map((header, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm font-medium">{header}</Label>
                  <Select
                    value={columnMappings[`col_${index}`] || ''}
                    onValueChange={(value) => 
                      setColumnMappings(prev => ({ ...prev, [`col_${index}`]: value }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Mapear para..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não mapear</SelectItem>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="unit">Unidade</SelectItem>
                      <SelectItem value="price">Preço</SelectItem>
                      <SelectItem value="vendor">Fornecedor</SelectItem>
                      <SelectItem value="notes">Observações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Data Preview */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {parsedData.headers.map((header, index) => (
                      <TableHead key={index} className="min-w-32">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.rows.slice(0, 10).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="max-w-32 truncate">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {parsedData.rows.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 10 de {parsedData.rows.length} linhas
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}