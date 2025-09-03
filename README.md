# Boitel JBS - Feedlot Vision

Sistema completo de simulação e análise de viabilidade para operações de confinamento bovino.

## 🚀 Funcionalidades

### Dashboard
- Visão geral com KPIs principais (simulações ativas, margem média, ROI, break-even)
- Estatísticas em tempo real baseadas nas simulações do usuário
- Links rápidos para principais funcionalidades

### Simulação de Confinamento
- **Passo 1**: Configuração de animais e performance (peso entrada, GMD, consumo, mortalidade)
- **Passo 2**: Preços e custos (compra, venda, ração, sanidade, transporte)
- **Passo 3**: Resultados em tempo real com KPIs calculados
- Edição de simulações existentes
- Duplicação de simulações

### Análise de Resultados
- KPIs detalhados: margem total, spread, break-even, ROI, payback
- Gráficos interativos: curva de peso, análise de sensibilidade
- Detalhamento de performance e análise financeira
- Exportação de resultados (CSV)

### Comparação de Simulações
- Seleção de até 3 simulações para comparação
- Visualização lado a lado dos principais indicadores
- Gráficos comparativos de margens, ROI, custos

### Gestão de Registros
- **Insumos**: CRUD completo com preços, fornecedores, unidades
- **Fornecedores**: Cadastro com dados de contato
- **Clientes**: Gestão de clientes e contatos
- Busca e filtros em tempo real

### Configuração de Premissas
- Capacidade do confinamento
- Custos fixos diários por cabeça
- Percentuais padrão de mortalidade e refugo
- Parâmetros globais da operação

### Upload e Importação
- Upload de arquivos CSV/XLSX para Supabase Storage
- Preview dos dados antes da importação
- Mapeamento automático para tabela de insumos
- Histórico de uploads realizados

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Gráficos**: Recharts
- **Backend**: Supabase (Auth, Database, Storage)
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form, Zod
- **Estado**: React Hooks, Context API

## 📊 Fórmulas de Cálculo

### Peso e Performance
- `peso_saida = peso_entrada + (gmd * dias_confinamento)`
- `peso_carcaca = peso_saida * 0.53` (rendimento carcaça)
- `arrobas_gancho = peso_carcaca / 15`
- `arrobas_ganho = (peso_saida - peso_entrada) / 15`

### Custos e Receitas
- `dmi_kg_dia = peso_medio * (dmi_pct_pv / 100)` (se não informado)
- `custo_racao = (dmi_kg_dia * dias * custo_kg_ms) * (1 + desperdicio/100)`
- `custo_compra = (peso_entrada/15) * preco_arroba OU peso_entrada * preco_kg`
- `receita = arrobas_gancho * preco_venda_arroba`

### Indicadores
- `margem_total = receita - custo_total`
- `custo_por_arroba = custo_total / arrobas_gancho`
- `spread = preco_venda - custo_por_arroba`
- `break_even = custo_por_arroba`
- `roi = (margem_total / custo_total) * 100`
- `payback = custo_total / (margem_total / dias_confinamento)`

## 🔧 Configuração

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Importante:** Nunca commite seu arquivo `.env.local` para controle de versão. O arquivo `.env` foi removido do tracking e adicionado ao `.gitignore`.

### Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview
```

## 🗃️ Estrutura do Banco

### Tabelas Principais
- `profiles` - Perfis de usuário
- `premises` - Configurações da propriedade
- `simulations` - Simulações de confinamento
- `simulation_results` - Resultados calculados
- `inputs` - Cadastro de insumos
- `suppliers` - Fornecedores
- `clients` - Clientes

### Segurança (RLS)
- Todas as tabelas possuem Row Level Security habilitado
- Políticas baseadas em `auth.uid() = created_by`
- Triggers automáticos para preenchimento do `created_by`
- Função `is_admin()` para bypass administrativo

## 🛣️ Rotas

- `/` - Dashboard principal
- `/simulation` - Nova simulação / Editar simulação
- `/simulations` - Lista de simulações
- `/results/:id` - Detalhes dos resultados
- `/compare` - Comparação de simulações
- `/registries` - Gestão de registros (Insumos/Fornecedores/Clientes)
- `/premises` - Configurações da propriedade
- `/uploads` - Upload e importação de dados

## 📱 Design System

### Cores e Tokens
- Utiliza tokens semânticos definidos em `index.css`
- Suporte completo a dark/light mode
- Componentes shadcn/ui customizados
- Paleta de cores consistente com gradientes

### Responsividade
- Design mobile-first
- Breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`
- Componentes adaptáveis para diferentes dispositivos
- Sidebar colapsível em dispositivos móveis

## 🔒 Segurança

### Autenticação
- Sistema completo via Supabase Auth
- Persistência de sessão no localStorage
- Refresh automático de tokens
- Rotas protegidas com `ProtectedRoute`

### Autorização
- RLS em todas as tabelas sensíveis
- Isolamento de dados por usuário
- Políticas de admin para operações especiais
- Validação tanto no frontend quanto no backend

## 📈 Performance

### Otimizações
- Lazy loading de componentes pesados
- Memoização com `useMemo` e `useCallback`
- Queries otimizadas com joins específicos
- Debounce em campos de busca
- Loading states em todas as operações async

### Monitoramento
- Error boundaries para captura de erros
- Logs estruturados no console
- Toast notifications para feedback do usuário
- Estados de loading granulares

Built with ❤️ using Lovable + Supabase
