import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchUnits, fetchDietasForUnit } from '@/services/unitMatrix';
import { TipoAnimalSelect } from './TipoAnimalSelect';
import type { SimulationFormType } from '@/schemas/simulationSchema';

interface DadosNegocioBlockProps {
  data: SimulationFormType;
  onChange: (data: SimulationFormType) => void;
  profiles: Array<{ id: string; first_name?: string; last_name?: string }>;
}

export function DadosNegocioBlock({ data, onChange, profiles }: DadosNegocioBlockProps) {
  const [units, setUnits] = useState<Array<{ id: string; code: string; name: string; state: string }>>([]);
  const [dietas, setDietas] = useState<string[]>([]);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const unitsData = await fetchUnits();
      setUnits(unitsData);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const handleFieldChange = (field: keyof SimulationFormType, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleDependencyChange = (field: keyof SimulationFormType, value: any) => {
    // Clear tipo_animal when dependencies change
    const updates: Partial<SimulationFormType> = { [field]: value };
    if (['unit_code', 'dieta', 'modalidade', 'date_ref'].includes(field) && data.tipo_animal) {
      updates.tipo_animal = undefined;
    }
    onChange({ ...data, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Dados do Negócio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* First Row: Pecuarista, Originator, Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pecuarista_name">Pecuarista</Label>
            <Input
              id="pecuarista_name"
              value={data.pecuarista_name || ''}
              onChange={(e) => handleFieldChange('pecuarista_name', e.target.value.toUpperCase())}
              placeholder="NOME DO PECUARISTA"
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="originator_id">Originador</Label>
            <Select 
              value={data.originator_id || ''} 
              onValueChange={(value) => handleFieldChange('originator_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o originador" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.first_name} {profile.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
             <Label htmlFor="date_ref">Data Referência</Label>
             <Input
               id="date_ref"
               type="date"
               value={data.date_ref ? new Date(data.date_ref).toISOString().split('T')[0] : ''}
               onChange={(e) => handleDependencyChange('date_ref', new Date(e.target.value))}
             />
           </div>
        </div>

        {/* Second Row: Unit, Diet, Animal Type, Modality */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="space-y-2">
             <Label htmlFor="unit_code">Unidade</Label>
             <Select 
               value={data.unit_id || ''} 
               onValueChange={async (value) => {
                 // Find the selected unit by ID
                 const selectedUnit = units.find(u => String(u.id) === String(value));
                 if (selectedUnit) {
                   // Update both unit_id and unit_code in form
                   const updates = {
                     ...data,
                     unit_id: String(selectedUnit.id),
                     unit_code: selectedUnit.code,
                     tipo_animal: undefined // Clear dependent
                   };
                   onChange(updates);
                   
                   // Load dietas for the selected unit
                   const dietasData = await fetchDietasForUnit(selectedUnit.code);
                   setDietas(dietasData);
                   
                   console.debug('[unitSelect]', { unit_id: selectedUnit.id, unit_code: selectedUnit.code });
                 }
               }}
               disabled={units.length === 0}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Selecione a unidade" />
               </SelectTrigger>
               <SelectContent>
                 {units.map(unit => (
                   <SelectItem key={unit.id} value={String(unit.id)}>
                     {unit.code} - {unit.state || 'N/A'}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-2">
             <Label htmlFor="dieta">Dieta</Label>
             <Select 
               value={data.dieta || ''} 
               onValueChange={(value) => handleDependencyChange('dieta', value)}
               disabled={!data.unit_code}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Selecione a dieta" />
               </SelectTrigger>
               <SelectContent>
                 {dietas.map(dieta => (
                   <SelectItem key={dieta} value={dieta}>
                     {dieta}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <TipoAnimalSelect
              data={data}
              onChange={handleFieldChange}
            />
           <div className="space-y-2">
             <Label htmlFor="modalidade">Modalidade</Label>
             <Select 
               value={data.modalidade || ''} 
               onValueChange={(value) => handleDependencyChange('modalidade', value)}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Selecione a modalidade" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="Diária">Diária</SelectItem>
                 <SelectItem value="Arroba Prod.">Arroba Prod.</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </div>

        {/* Third Row: Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="qtd_animais">Qtd Cabeças</Label>
            <Input
              id="qtd_animais"
              type="number"
              value={data.qtd_animais || ''}
              onChange={(e) => handleFieldChange('qtd_animais', Number(e.target.value))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}