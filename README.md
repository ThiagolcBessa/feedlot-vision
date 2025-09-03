# Boitel JBS - Feedlot Viability Simulator

Sistema de simulação de viabilidade para confinamento bovino com gestão completa de dados.

## 🚀 Funcionalidades

- **Dashboard**: Visão geral dos KPIs principais
- **Premissas**: Configuração de parâmetros globais do confinamento
- **Simulação**: Criação e cálculo de cenários de confinamento
- **Simulações**: Listagem, busca, duplicação e exclusão de simulações
- **Resultados**: Visualização detalhada com gráficos e análise de sensibilidade
- **Cadastros**: Gestão de insumos, fornecedores e clientes
- **Comparação**: Comparação lado a lado de até 3 simulações
- **Upload**: Importação em lote via CSV/XLSX
- **Autenticação**: Sistema seguro com RLS (Row Level Security)

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth + Database + Storage)
- **Gráficos**: Recharts
- **Routing**: React Router DOM
- **State**: React Query + Context API

## 📊 Schema do Banco de Dados

### Principais Tabelas

- **profiles**: Perfis de usuários com roles (user/admin)
- **premises**: Premissas globais do confinamento
- **inputs**: Cadastro de insumos (milho, ração, suplementos, etc.)
- **suppliers**: Cadastro de fornecedores
- **clients**: Cadastro de clientes
- **simulations**: Simulações criadas pelos usuários
- **simulation_results**: Resultados calculados das simulações

### Storage
- **uploads**: Bucket para arquivos CSV/XLSX

## 🔐 Segurança

Todas as tabelas possuem **Row Level Security (RLS)** habilitado com políticas que garantem:
- Usuários só acessam seus próprios dados
- Administradores podem acessar todos os dados
- Campos `created_by` são preenchidos automaticamente

## 📈 Fórmulas de Cálculo

### Métricas Básicas
```
Peso de Saída = Peso Entrada + (GMD × Dias Confinamento)
Peso Carcaça = Peso Saída × 53%
Arrobas Hook = Peso Carcaça ÷ 15
Arrobas Ganho = (Peso Saída - Peso Entrada) ÷ 15
```

### Custos
```
Custo Ração = DMI × Dias × Custo MS × (1 + % Desperdício)
Custo Total = Compra + Ração + Sanidade + Transporte + Financeiro + Depreciação + Overhead + Fixo + Mortalidade
```

### KPIs
```
Margem Total = Receita - Custo Total
Spread (R$/@) = Preço Venda - Custo por @
Break-even (R$/@) = Custo Total ÷ Arrobas Hook
ROI (%) = (Margem Total ÷ Custo Total) × 100
Payback (dias) = Custo Total ÷ (Margem ÷ Dias)
```

## ⚙️ Configuração

### Variáveis de Ambiente

O projeto usa as seguintes constantes do Supabase (já configuradas):
```
SUPABASE_URL = "https://tsydbthtusyaarthnrhv.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Instalação

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Execute o projeto: `npm run dev`
4. Acesse: `http://localhost:5173`

### Banco de Dados

O banco está configurado no Supabase com:
- Autenticação habilitada
- RLS em todas as tabelas
- Políticas de segurança configuradas
- Storage bucket para uploads

## 📱 Páginas e Rotas

| Rota | Página | Funcionalidade |
|------|--------|----------------|
| `/` | Dashboard | KPIs e resumo geral |
| `/premises` | Premissas | Configuração global |
| `/simulation` | Simulação | Criar nova simulação |
| `/simulations` | Simulações | Listar simulações |
| `/results/:id` | Resultados | Detalhes da simulação |
| `/registries` | Cadastros | CRUD de insumos/fornecedores/clientes |
| `/compare` | Comparação | Comparar simulações |
| `/uploads` | Upload | Importar dados CSV/XLSX |
| `/settings` | Configurações | Perfil do usuário |

## 🎨 Design System

- **Cores**: HSL com tokens semânticos
- **Tema**: Light mode, clean, minimalista  
- **Componentes**: shadcn/ui customizados
- **Responsivo**: Mobile-first design
- **Tipografia**: Sistema consistente

## 🧪 Uso da Aplicação

1. **Cadastro/Login**: Crie uma conta ou faça login
2. **Premissas**: Configure os parâmetros globais
3. **Cadastros**: Adicione insumos, fornecedores e clientes
4. **Simulação**: Crie cenários de confinamento
5. **Resultados**: Analise KPIs e gráficos
6. **Comparação**: Compare diferentes simulações
7. **Upload**: Importe dados em lote

## 🔧 Principais Hooks

- `useTableCRUD(tableName)`: CRUD genérico para tabelas
- `useAuth()`: Contexto de autenticação
- `useToast()`: Sistema de notificações

## 📊 Funcionalidades de Negócio

- Cálculo automático de KPIs em tempo real
- Análise de sensibilidade (±5%, ±10%)
- Duplicação de simulações para cenários
- Comparação visual entre simulações
- Importação em lote de planilhas
- Gestão de premissas por usuário
- Histórico de simulações

## 🚀 Próximos Passos

- [ ] Implementar exportação PDF/CSV dos resultados
- [ ] Adicionar mais opções de análise de sensibilidade
- [ ] Integração com APIs de preços em tempo real
- [ ] Dashboard executivo com filtros avançados
- [ ] Relatórios customizáveis
- [ ] Notificações por email

---

Desenvolvido com ❤️ para o setor pecuário brasileiro.
