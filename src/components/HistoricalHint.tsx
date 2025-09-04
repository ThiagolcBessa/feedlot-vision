import React from 'react';
import { formatCurrency, formatWeight, formatPercentage } from '@/services/calculations';

interface HistoricalHintProps {
  fieldName: string;
  hints: { unit_median?: number; originator_median?: number };
  formatter?: (value: number) => string;
}

export function HistoricalHint({ fieldName, hints, formatter = (v) => v.toString() }: HistoricalHintProps) {
  if (!hints.unit_median && !hints.originator_median) return null;

  return (
    <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
      {hints.unit_median && (
        <div>Mediana Unidade (12m): {formatter(hints.unit_median)}</div>
      )}
      {hints.originator_median && (
        <div>Mediana Originador (12m): {formatter(hints.originator_median)}</div>
      )}
    </div>
  );
}