// Validation utilities for feedlot simulation

export interface ValidationRange {
  min?: number;
  max?: number;
  warn_min?: number;
  warn_max?: number;
}

export interface ValidationResult {
  isValid: boolean;
  level: 'error' | 'warning' | 'success';
  message?: string;
}

// Validation ranges for different parameters
export const VALIDATION_RANGES = {
  entry_weight_kg: { min: 1, warn_min: 200, warn_max: 400, max: 1000 },
  days_on_feed: { min: 1, warn_min: 60, warn_max: 200, max: 365 },
  adg_kg_day: { min: 0.1, warn_min: 0.8, warn_max: 2.0, max: 5.0 },
  dmi_pct_bw: { min: 0.5, warn_min: 1.8, warn_max: 3.5, max: 10.0 },
  feed_waste_pct: { min: 0, warn_max: 10, max: 50 },
  mortality_pct: { min: 0, warn_max: 5, max: 20 },
  selling_price_per_at: { min: 0.01, warn_min: 100, warn_max: 500, max: 1000 },
  purchase_price_per_at: { min: 0.01, warn_min: 100, warn_max: 500, max: 1000 },
  purchase_price_per_kg: { min: 0.01, warn_min: 5, warn_max: 25, max: 100 },
  feed_cost_kg_dm: { min: 0.01, warn_min: 0.3, warn_max: 2.0, max: 10.0 },
} as const;

export function validateField(
  field: keyof typeof VALIDATION_RANGES,
  value: number | undefined | null
): ValidationResult {
  if (value === undefined || value === null || isNaN(value)) {
    return {
      isValid: false,
      level: 'error',
      message: 'Campo obrigatório',
    };
  }

  const range = VALIDATION_RANGES[field];
  
  // Check hard limits (error level)
  if (range.min !== undefined && value < range.min) {
    return {
      isValid: false,
      level: 'error',
      message: `Valor deve ser maior que ${range.min}`,
    };
  }
  
  if (range.max !== undefined && value > range.max) {
    return {
      isValid: false,
      level: 'error',
      message: `Valor deve ser menor que ${range.max}`,
    };
  }

  // Check warning ranges
  if ('warn_min' in range && range.warn_min !== undefined && value < range.warn_min) {
    return {
      isValid: true,
      level: 'warning',
      message: `Valor baixo. Recomendado: ${range.warn_min} - ${range.warn_max || '∞'}`,
    };
  }
  
  if ('warn_max' in range && range.warn_max !== undefined && value > range.warn_max) {
    const minText = ('warn_min' in range && range.warn_min !== undefined) ? range.warn_min.toString() : '0';
    return {
      isValid: true,
      level: 'warning',
      message: `Valor alto. Recomendado: ${minText} - ${range.warn_max}`,
    };
  }

  return {
    isValid: true,
    level: 'success',
  };
}

export function validateRequired(value: any): ValidationResult {
  if (value === undefined || value === null || value === '' || 
      (typeof value === 'number' && isNaN(value))) {
    return {
      isValid: false,
      level: 'error',
      message: 'Campo obrigatório',
    };
  }
  
  return {
    isValid: true,
    level: 'success',
  };
}

export function validatePurchasePrice(
  price_per_at?: number,
  price_per_kg?: number
): ValidationResult {
  if (!price_per_at && !price_per_kg) {
    return {
      isValid: false,
      level: 'error',
      message: 'Informe o preço de compra por arroba OU por kg',
    };
  }

  if (price_per_at && price_per_kg) {
    return {
      isValid: true,
      level: 'warning',
      message: 'Apenas um preço de compra será usado (preferência: por arroba)',
    };
  }

  return {
    isValid: true,
    level: 'success',
  };
}

// Format currency for display
export function formatCurrencyInput(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

// Parse currency input
export function parseCurrencyInput(value: string): number {
  return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
}