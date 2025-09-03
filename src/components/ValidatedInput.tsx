import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ValidationResult } from '@/utils/validation';
import { cn } from '@/lib/utils';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  validation?: ValidationResult;
  unit?: string;
  helpText?: string;
}

export function ValidatedInput({
  label,
  validation,
  unit,
  helpText,
  className,
  ...props
}: ValidatedInputProps) {
  const hasValidation = validation && (validation.message || validation.level !== 'success');
  
  const getValidationIcon = () => {
    if (!validation) return null;
    
    switch (validation.level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  const getInputClassName = () => {
    if (!validation) return '';
    
    switch (validation.level) {
      case 'error':
        return 'border-destructive focus:border-destructive';
      case 'warning':
        return 'border-warning focus:border-warning';
      case 'success':
        return 'border-success focus:border-success';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={props.id} className="text-sm font-medium">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {unit && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {unit}
          </span>
        )}
      </div>
      
      <div className="relative">
        <Input
          {...props}
          className={cn(getInputClassName(), className)}
        />
        {validation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}

      {hasValidation && (
        <Alert 
          variant={validation.level === 'error' ? 'destructive' : 'default'}
          className={cn(
            'py-2',
            validation.level === 'warning' && 'border-warning bg-warning/10',
            validation.level === 'success' && 'border-success bg-success/10'
          )}
        >
          <AlertDescription className="text-xs">
            {validation.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}