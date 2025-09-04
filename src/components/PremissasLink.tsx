import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PremissasLinkProps {
  unit_code?: string;
  modalidade?: string;
  dieta?: string;
  tipo_animal?: string;
  highlightId?: string;
  className?: string;
}

export function PremissasLink({ 
  unit_code, 
  modalidade, 
  dieta, 
  tipo_animal, 
  highlightId,
  className 
}: PremissasLinkProps) {
  const params = new URLSearchParams();
  
  if (unit_code) params.append('unit', unit_code);
  if (modalidade) params.append('modalidade', modalidade);
  if (dieta) params.append('dieta', dieta);
  if (tipo_animal) params.append('tipo_animal', tipo_animal);
  if (highlightId) params.append('highlight', highlightId);
  
  const queryString = params.toString();
  const href = `/premissas${queryString ? `?${queryString}` : ''}`;

  return (
    <Button 
      asChild 
      variant="outline" 
      size="sm"
      className={className}
    >
      <Link to={href}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Ver Premissas da Unidade
      </Link>
    </Button>
  );
}