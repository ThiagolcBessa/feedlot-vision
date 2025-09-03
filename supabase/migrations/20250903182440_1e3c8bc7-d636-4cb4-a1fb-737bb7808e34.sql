-- Create comprehensive database schema for Boitel JBS feedlot simulator

-- Update profiles table to include role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inputs table
CREATE TABLE public.inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  vendor TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create premises table
CREATE TABLE public.premises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  capacity_head INTEGER NOT NULL DEFAULT 1000,
  fixed_cost_daily_per_head NUMERIC(10,4) NOT NULL DEFAULT 0,
  admin_overhead_daily_per_head NUMERIC(10,4) NOT NULL DEFAULT 0,
  default_mortality_pct NUMERIC(5,2) NOT NULL DEFAULT 2.0,
  default_reject_pct NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create simulations table
CREATE TABLE public.simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  entry_weight_kg NUMERIC(8,2) NOT NULL,
  days_on_feed INTEGER NOT NULL,
  adg_kg_day NUMERIC(5,3) NOT NULL,
  dmi_pct_bw NUMERIC(5,2),
  dmi_kg_day NUMERIC(6,2),
  purchase_price_per_at NUMERIC(10,2),
  purchase_price_per_kg NUMERIC(8,2),
  selling_price_per_at NUMERIC(10,2) NOT NULL,
  health_cost_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  transport_cost_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  financial_cost_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  depreciation_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  overhead_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  feed_cost_kg_dm NUMERIC(8,4) NOT NULL,
  feed_waste_pct NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  mortality_pct NUMERIC(5,2) NOT NULL DEFAULT 2.0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create simulation_results table
CREATE TABLE public.simulation_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL,
  exit_weight_kg NUMERIC(8,2) NOT NULL,
  carcass_weight_kg NUMERIC(8,2) NOT NULL,
  arroubas_hook NUMERIC(8,2) NOT NULL,
  arroubas_gain NUMERIC(8,2) NOT NULL,
  cost_per_animal NUMERIC(10,2) NOT NULL,
  cost_per_arrouba NUMERIC(10,2) NOT NULL,
  margin_total NUMERIC(12,2) NOT NULL,
  spread_r_per_at NUMERIC(10,2) NOT NULL,
  break_even_r_per_at NUMERIC(10,2) NOT NULL,
  roi_pct NUMERIC(8,2) NOT NULL,
  payback_days NUMERIC(8,1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Users can view their own suppliers" ON public.suppliers
  FOR SELECT USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create their own suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own suppliers" ON public.suppliers
  FOR UPDATE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can delete their own suppliers" ON public.suppliers
  FOR DELETE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients
  FOR SELECT USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create their own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can delete their own clients" ON public.clients
  FOR DELETE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for inputs
CREATE POLICY "Users can view their own inputs" ON public.inputs
  FOR SELECT USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create their own inputs" ON public.inputs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own inputs" ON public.inputs
  FOR UPDATE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can delete their own inputs" ON public.inputs
  FOR DELETE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for premises
CREATE POLICY "Users can view their own premises" ON public.premises
  FOR SELECT USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create their own premises" ON public.premises
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own premises" ON public.premises
  FOR UPDATE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can delete their own premises" ON public.premises
  FOR DELETE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for simulations
CREATE POLICY "Users can view their own simulations" ON public.simulations
  FOR SELECT USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create their own simulations" ON public.simulations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own simulations" ON public.simulations
  FOR UPDATE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can delete their own simulations" ON public.simulations
  FOR DELETE USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for simulation_results
CREATE POLICY "Users can view their own simulation results" ON public.simulation_results
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_results.simulation_id 
    AND (simulations.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Users can create simulation results for their simulations" ON public.simulation_results
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_results.simulation_id 
    AND simulations.created_by = auth.uid()
  ));

CREATE POLICY "Users can update simulation results for their simulations" ON public.simulation_results
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_results.simulation_id 
    AND (simulations.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Users can delete simulation results for their simulations" ON public.simulation_results
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE simulations.id = simulation_results.simulation_id 
    AND (simulations.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
    ))
  ));

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inputs_updated_at
  BEFORE UPDATE ON public.inputs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_premises_updated_at
  BEFORE UPDATE ON public.premises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_simulations_updated_at
  BEFORE UPDATE ON public.simulations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.simulation_results 
ADD CONSTRAINT fk_simulation_results_simulation_id 
FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE CASCADE;

-- Seed data for inputs
INSERT INTO public.inputs (name, unit, price, vendor, notes, created_by) VALUES
('Milho', 'R$/ton', 800.00, 'Fornecedor Padrão', 'Milho grão seco', (SELECT auth.uid())),
('Ração Proteinada', 'R$/ton', 1200.00, 'Fornecedor Padrão', 'Ração com 20% PB', (SELECT auth.uid())),
('Suplementos', 'R$/animal/dia', 2.50, 'Fornecedor Padrão', 'Suplementos minerais', (SELECT auth.uid())),
('Sanidade', 'R$/animal', 45.00, 'Fornecedor Padrão', 'Custos veterinários', (SELECT auth.uid())),
('Transporte', 'R$/animal', 25.00, 'Fornecedor Padrão', 'Frete e movimentação', (SELECT auth.uid()))
ON CONFLICT DO NOTHING;