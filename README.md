# Boitel JBS - Feedlot Management System

A comprehensive feedlot management and viability simulation platform built with React, TypeScript, and Supabase.

## 🎯 Overview

Boitel JBS is a web application designed for feedlot operations management, providing:

- **Negotiation Flow**: Complete business data management (Dados do Negócio) with pricing matrix integration
- **Simulation Engine**: Advanced feedlot viability calculations with real-time results
- **Pricing Matrix**: Dynamic pricing based on unit, modality, diet, animal type, and weight ranges
- **DRE Analysis**: Dual perspective financial analysis (Pecuarista & JBS)
- **Double Sensitivity**: ±5% and ±10% variations on price and feed cost with full KPI recalculation
- **Database Management**: Comprehensive CRUD operations for all entities

## 🗄️ Database Schema (NO DDL CHANGES)

**IMPORTANT**: Database schema is sealed. All work uses existing tables via Supabase CRUD only.

### Core Tables (Read-Only Access)
- **profiles**: User management with role-based access (admin/basic)
- **units**: Feedlot units catalog (CGA, CBS, CCF, CLV, CPN)
- **unit_price_matrix**: Pricing matrix with weight ranges and modalidades (768 rows of pricing data)
- **negotiations**: Business data with historical medians (empty - will be populated)
- **simulations**: Feedlot simulation parameters
- **simulation_results**: Calculated KPIs and financial results
- **premises**: Feedlot premises with operational parameters
- **clients, suppliers, inputs**: Supporting registries

### Key Features

#### Unit Pricing Matrix
The system uses the existing `unit_price_matrix` table with:
- **Weight range matching**: `peso_de_kg <= entry_weight <= peso_ate_kg`
- **Open range support**: null bounds mean unlimited range
- **Modalidades**: "Diária" (R$/head/day) vs "Arroba Prod." (R$/@)
- **Product labels**: Auto-generated via `concat_label` field
- **Selection keys**: unit_code + modalidade + dieta + tipo_animal + entry_weight

Sample data structure:
```sql
-- Example pricing matrix row
unit_code: "CGA"
modalidade: "Diária" 
dieta: "Volumoso"
tipo_animal: "Boi Nelore"
peso_de_kg: 0, peso_ate_kg: 290
tabela_final_r_por_arroba: 18.0
diaria_r_por_cab_dia: 227.16
concat_label: "CGABoi Nelore45809Diária"
```

#### Calculation Engine Enhancements
- **DMI Method**: Average weight (recommended) vs exit weight calculation
- **Service Pricing**: Modality-based pricing integration
  - Diária: `days_on_feed * diaria_r_por_cab_dia`
  - Arroba Prod.: `arroubas_gain * tabela_final_r_por_arroba`
- **DRE Pecuarista**: Revenue from fat cattle - lean cattle cost - service cost - fees
- **DRE JBS**: Service revenue - feed costs - operational costs
- **Enhanced Sensitivity**: ±5%/±10% variations with full simulation recalculation

#### Historical Medians (Negotiation Flow)
- **Unit median**: Same unit + animal type + modality (12 months historical)
- **Originator median**: Same user's historical data (12 months)
- **Display as hints**: Under zootechnical inputs in blue/green text
- **Client-side calculation**: Median computation from fetched historical data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase project access (existing tables)

### Environment Setup
```env
VITE_SUPABASE_URL=https://tsydbthtusyaarthnrhv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Verification
The app runs preflight checks on startup:
- `units` table (6 records)
- `unit_price_matrix` table (768 records)
- `negotiations` table (empty, ready for population)
- `simulations` and `simulation_results` tables

If any required table is missing, displays: "Database schema is locked and required tables are missing. Contact admin."

## 📊 Core Calculations & Formulas

### Basic Simulation Math
```javascript
// Weight and performance
exit_weight = entry_weight + (adg * days_on_feed)
carcass_weight = exit_weight * carcass_yield_pct  // Default 53%
arroubas_hook = carcass_weight / 15
arroubas_gain = (exit_weight - entry_weight) / 15

// DMI calculation (user selectable method)
if (use_average_weight) {
  avg_weight = (entry_weight + exit_weight) / 2
  dmi_kg_day = avg_weight * (pct_pv / 100)
} else {
  dmi_kg_day = exit_weight * (pct_pv / 100)  // Original method
}

// Feed costs
feed_cost_total = (dmi_kg_day * days * feed_cost_kg_dm) * (1 + waste_pct/100)
```

### Service Pricing Integration
```javascript
// Based on modalidade from pricing matrix
if (modalidade === 'Arroba Prod.') {
  service_cost = arroubas_gain * tabela_final_r_por_arroba
} else if (modalidade === 'Diária') {
  service_cost = days_on_feed * diaria_r_por_cab_dia
}
```

### DRE Calculations

#### DRE Pecuarista (Rancher Perspective)
```javascript
revenue_fat_cattle = arroubas_hook * selling_price_per_at * qty_animals
cost_lean_cattle = arroubas_magro * lean_price_per_at * qty_animals + agio
cost_fattening_service = service_cost * qty_animals
fees_freight = transport_costs * qty_animals

result_per_head = (revenue_fat_cattle - cost_lean_cattle - cost_fattening_service - fees_freight) / qty_animals
cost_per_arroba_produced = total_costs / (arroubas_gain * qty_animals)
monthly_return_pct = (result_per_head / cost_lean_cattle) * (30 / days_on_feed) * 100
```

#### DRE JBS (Feedlot Perspective)  
```javascript
service_revenue = service_cost  // From pricing matrix
total_costs = feed_costs + freight + sanitary + ctr + cf + corp + depreciation + financial

result_jbs = service_revenue - total_costs
result_per_arroba = result_jbs / arroubas_gain
```

### Double Sensitivity Analysis
```javascript
// Each scenario recalculates full simulation
scenarios = [
  { price_delta: ±5%, feed_delta: 0% },
  { price_delta: ±10%, feed_delta: 0% },
  { price_delta: 0%, feed_delta: ±5% },
  { price_delta: 0%, feed_delta: ±10% }
]

// Matrix view: price variations (rows) × feed variations (columns)
// Each cell shows: margin_total and roi_pct after full recalculation
```

## 🔐 Security & Access

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- **User data isolation**: Users see only their own records (`created_by = auth.uid()`)
- **Admin bypass**: Admin users can view/edit all data (`is_admin(auth.uid())`)
- **Public read access**: `units`, `unit_price_matrix` tables
- **Auto-fill triggers**: `set_created_by()` trigger on insert

### Authentication
- Supabase Auth with email/password
- Automatic profile creation on signup
- Role-based UI features (admin vs basic users)

## 📱 Application Pages

### Core Flow
1. **Dashboard**: Overview with quick stats and navigation
2. **Simulation Wizard** (3 steps):
   - **Step 1**: Dados do Negócio + Animal & Performance
   - **Step 2**: Prices & Costs  
   - **Step 3**: Results with live calculations
3. **Results**: Detailed KPIs, charts, double sensitivity analysis
4. **Simulations**: Listing, management, comparison
5. **Compare**: Side-by-side scenario analysis

### Data Management
- **Premises**: Operational parameters and fixed costs
- **Registries**: Clients, suppliers, inputs (full CRUD)
- **Uploads**: CSV import with column mapping
- **Settings**: User profile and preferences

### Dados do Negócio Implementation
The business data section includes:

**Identification Fields:**
- Pecuarista (UPPERCASE input)
- Originator (defaults to logged user, selectable from profiles)
- Negotiation Date (reference only)
- Unit selection (from units table)

**Selection Criteria:**
- Modalidade: "Diária" vs "Arroba Prod."
- Diet: Fetched dynamically based on unit
- Animal Type: Fetched based on unit + diet
- Scale Type: Fazenda/Balanção/Balancinha

**Auto-Fill from Pricing Matrix:**
When Unit + Modalidade + Diet + Animal Type + Entry Weight are selected:
- Service Price displays automatically
- Product Tag (concat_label) shows as chip
- Zootechnical suggestions populate
- Historical medians display as hints

**Lot & Weights:**
- Quantity of animals
- Farm weight, scale weight, adjusted weight
- Breakage percentages (farm→feedlot, scale)

## 🎨 Design System

### Component Architecture
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **Semantic tokens**: HSL color system in index.css
- **Responsive design**: Mobile-first approach
- **Theme support**: Dark/light mode

### Color System
All colors use HSL semantic tokens:
```css
:root {
  --primary: [hsl values];
  --secondary: [hsl values]; 
  --accent: [hsl values];
  /* Never use direct colors like bg-white, text-black */
}
```

## 🔧 Technical Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **State**: React Hooks, Context API

## 📈 Negotiation & Pricing Flow

### Complete Workflow
1. **Unit Selection**: Choose from available units (CGA, CBS, etc.)
2. **Criteria Selection**: Modalidade → Diet → Animal Type
3. **Weight Input**: Entry weight for range matching
4. **Matrix Lookup**: Find pricing row with weight range logic
5. **Auto-Suggestions**: Populate zootechnical parameters
6. **Historical Hints**: Display unit/originator medians
7. **Service Pricing**: Calculate based on modality
8. **Product Label**: Display concat_label as visual chip
9. **Full Simulation**: Run enhanced calculations with negotiation data
10. **DRE Generation**: Create both Pecuarista and JBS perspectives

### Pricing Matrix Logic
```javascript
// Weight range matching query (conceptual)
SELECT * FROM unit_price_matrix 
WHERE unit_code = ? 
  AND modalidade = ?
  AND dieta = ?
  AND tipo_animal = ?
  AND (peso_de_kg IS NULL OR entry_weight >= peso_de_kg)
  AND (peso_ate_kg IS NULL OR entry_weight <= peso_ate_kg)
  AND is_active = true
ORDER BY peso_de_kg ASC NULLS FIRST, peso_ate_kg ASC NULLS LAST
LIMIT 1
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run preview  # Test production build locally
```

### Environment Variables
- Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Never commit `.env` files to version control
- Configure in deployment platform settings

## 📝 Development Guidelines

### Database Operations
- **NO DDL ALLOWED**: Never create/alter/drop database objects
- **CRUD ONLY**: Use Supabase client for select/insert/update/delete
- **Error Handling**: Show user-friendly messages for missing data
- **Fallbacks**: Provide defaults when pricing matrix data unavailable

### Code Organization
- **Services**: Separate business logic (calculations, pricing, negotiations)
- **Components**: Reusable UI components with proper TypeScript
- **Hooks**: Custom hooks for data fetching and state management
- **Types**: Strong typing for all interfaces and data structures

### Performance Optimization
- **Lazy loading**: Large components and routes
- **Memoization**: Expensive calculations with useMemo/useCallback
- **Debouncing**: Search inputs and real-time calculations
- **Error boundaries**: Graceful error handling

## 🎯 Acceptance Criteria ✅

- [x] **No DDL executed**: All work uses existing tables via Supabase client
- [x] **Dados do Negócio implemented**: Complete business data section with matrix integration
- [x] **Pricing matrix integration**: Weight range matching, service pricing, product labels
- [x] **Historical medians**: 12-month unit and originator medians as hints
- [x] **Enhanced calculations**: DRE Pecuarista and DRE JBS with service pricing
- [x] **Double sensitivity**: ±5%/±10% variations with full KPI recalculation
- [x] **Matrix sensitivity view**: Combined price/feed variation analysis
- [x] **Compare page alignment**: Consistent KPI display and comparison
- [x] **Settings integration**: Real settings page with user preferences
- [x] **Environment cleanup**: Proper VITE_* usage, no .env tracking

## 📄 License

Proprietary - JBS S.A.

---

**Built with ❤️ using Lovable + Supabase**

*This application handles sensitive business data. Ensure proper access controls and data handling procedures are followed.*