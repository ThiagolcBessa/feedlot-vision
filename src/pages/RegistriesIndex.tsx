import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, Cat, FileText, Wheat, Grid3X3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const registryCards = [
  {
    title: 'Originadores',
    description: 'Gerencie usuários e níveis de acesso',
    icon: Users,
    href: '/cadastros/originadores',
    color: 'text-blue-600',
  },
  {
    title: 'Unidades',
    description: 'Unidades de confinamento',
    icon: Building2,
    href: '/cadastros/unidades',
    color: 'text-green-600',
  },
  {
    title: 'Tipos de Animal',
    description: 'Categorias disponíveis na matriz',
    icon: Cat,
    href: '/cadastros/tipos-animal',
    color: 'text-orange-600',
  },
  {
    title: 'Modalidades',
    description: 'Formas de cobrança disponíveis',
    icon: FileText,
    href: '/cadastros/modalidades',
    color: 'text-purple-600',
  },
  {
    title: 'Dietas',
    description: 'Tipos de alimentação disponíveis',
    icon: Wheat,
    href: '/cadastros/dietas',
    color: 'text-amber-600',
  },
];

export default function RegistriesIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastros</h1>
        <p className="text-muted-foreground">
          Gerencie os registros administrativos do sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {registryCards.map((card) => (
          <Card key={card.href} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to={card.href}>
                  Acessar
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}