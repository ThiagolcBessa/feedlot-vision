import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, BarChart3, Database, TrendingUp, DollarSign, Beef } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua operação de confinamento
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulações Ativas</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 desde o mês passado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 245/@</div>
            <p className="text-xs text-muted-foreground">+12% vs. simulação anterior</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Animais Simulados</CardTitle>
            <Beef className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.450</div>
            <p className="text-xs text-muted-foreground">Total em simulações ativas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5%</div>
            <p className="text-xs text-muted-foreground">Meta: 15% - 20%</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Nova Simulação
            </CardTitle>
            <CardDescription>
              Configure uma nova simulação de confinamento com diferentes cenários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/simulation">Iniciar Simulação</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise de Resultados
            </CardTitle>
            <CardDescription>
              Visualize gráficos e relatórios das suas simulações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/results">Ver Resultados</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerenciar Registros
            </CardTitle>
            <CardDescription>
              Configure fornecedores, insumos e parâmetros do confinamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/registry">Gerenciar Dados</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Suas últimas simulações e alterações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-l-4 border-l-primary pl-4">
              <div>
                <p className="font-medium">Simulação Boi 450kg - 120 dias</p>
                <p className="text-sm text-muted-foreground">Criada há 2 horas</p>
              </div>
              <span className="text-sm text-green-600 font-medium">Concluída</span>
            </div>
            
            <div className="flex items-center justify-between border-l-4 border-l-secondary pl-4">
              <div>
                <p className="font-medium">Atualização de preços - Milho</p>
                <p className="text-sm text-muted-foreground">Há 1 dia</p>
              </div>
              <span className="text-sm text-blue-600 font-medium">Processado</span>
            </div>
            
            <div className="flex items-center justify-between border-l-4 border-l-muted pl-4">
              <div>
                <p className="font-medium">Novo fornecedor adicionado</p>
                <p className="text-sm text-muted-foreground">Há 3 dias</p>
              </div>
              <span className="text-sm text-muted-foreground font-medium">Registrado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}