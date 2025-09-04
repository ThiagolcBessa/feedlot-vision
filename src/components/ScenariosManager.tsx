import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Copy, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  Play,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { SimulationInput } from '@/services/calculations';

export interface Scenario {
  id: string;
  name: string;
  isActive: boolean;
  formData: Partial<SimulationInput> & { title: string; notes?: string };
  businessData: any;
}

interface ScenariosManagerProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onScenarioChange: (scenarioId: string) => void;
  onAddScenario: () => void;
  onDuplicateScenario: (scenarioId: string) => void;
  onRenameScenario: (scenarioId: string, newName: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
}

export function ScenariosManager({
  scenarios,
  activeScenarioId,
  onScenarioChange,
  onAddScenario,
  onDuplicateScenario,
  onRenameScenario,
  onDeleteScenario
}: ScenariosManagerProps) {
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  const handleStartEditing = (scenarioId: string, currentName: string) => {
    setEditingScenario(scenarioId);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingScenario && editingName.trim()) {
      onRenameScenario(editingScenario, editingName.trim());
    }
    setEditingScenario(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingScenario(null);
    setEditingName('');
  };

  const handleAddScenario = () => {
    if (newScenarioName.trim()) {
      // Create new scenario based on current active scenario
      const activeScenario = scenarios.find(s => s.id === activeScenarioId);
      const newScenario: Scenario = {
        id: `scenario-${Date.now()}`,
        name: newScenarioName.trim(),
        isActive: false,
        formData: activeScenario ? { ...activeScenario.formData } : { title: '' },
        businessData: activeScenario ? { ...activeScenario.businessData } : {}
      };
      
      onAddScenario();
      // After creation, rename the new scenario
      setTimeout(() => {
        onRenameScenario(newScenario.id, newScenarioName.trim());
      }, 100);
      
      setShowAddDialog(false);
      setNewScenarioName('');
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Cenários</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cenário</DialogTitle>
                <DialogDescription>
                  Crie um novo cenário baseado no cenário ativo atual
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">Nome do Cenário</Label>
                  <Input
                    id="scenario-name"
                    value={newScenarioName}
                    onChange={(e) => setNewScenarioName(e.target.value)}
                    placeholder="Ex: Cenário Otimista"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddScenario()}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddScenario} disabled={!newScenarioName.trim()}>
                  Criar Cenário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                scenario.id === activeScenarioId
                  ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20'
                  : 'bg-muted/50 hover:bg-muted border-border'
              }`}
              onClick={() => onScenarioChange(scenario.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {scenario.id === activeScenarioId && (
                    <Play className="w-3 h-3 text-primary fill-primary" />
                  )}
                  {editingScenario === scenario.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-6 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        onBlur={handleSaveEdit}
                      />
                      <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-sm">{scenario.name}</span>
                      {scenario.id === activeScenarioId && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          Ativo
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                
                {editingScenario !== scenario.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditing(scenario.id, scenario.name);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateScenario(scenario.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    {scenarios.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteScenario(scenario.id);
                        }}
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick scenario stats */}
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="grid grid-cols-2 gap-1">
                  <span>Peso: {scenario.formData.entry_weight_kg || 0}kg</span>
                  <span>Dias: {scenario.formData.days_on_feed || 0}</span>
                  <span>GMD: {scenario.formData.adg_kg_day || 0}kg/d</span>
                  <span>Venda: R${scenario.formData.selling_price_per_at || 0}/@</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {scenarios.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum cenário criado ainda</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={onAddScenario}>
              Criar Primeiro Cenário
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}