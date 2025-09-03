-- 1.1 Add carcass yield to premises
ALTER TABLE public.premises
ADD COLUMN IF NOT EXISTS carcass_yield_pct NUMERIC NOT NULL DEFAULT 0.53;

-- 1.2 Create generic trigger function for auto-filling created_by
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers to all user-owned tables
DROP TRIGGER IF EXISTS trg_inputs_set_created_by ON public.inputs;
CREATE TRIGGER trg_inputs_set_created_by
BEFORE INSERT ON public.inputs
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS trg_suppliers_set_created_by ON public.suppliers;
CREATE TRIGGER trg_suppliers_set_created_by
BEFORE INSERT ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS trg_clients_set_created_by ON public.clients;
CREATE TRIGGER trg_clients_set_created_by
BEFORE INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS trg_premises_set_created_by ON public.premises;
CREATE TRIGGER trg_premises_set_created_by
BEFORE INSERT ON public.premises
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS trg_simulations_set_created_by ON public.simulations;
CREATE TRIGGER trg_simulations_set_created_by
BEFORE INSERT ON public.simulations
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS trg_simresults_set_created_by ON public.simulation_results;
CREATE TRIGGER trg_simresults_set_created_by
BEFORE INSERT ON public.simulation_results
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Ensure RLS is enabled and create proper policies for all tables

-- INPUTS table policies
ALTER TABLE public.inputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_rows_inputs" ON public.inputs;
CREATE POLICY "own_rows_inputs"
ON public.inputs
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "admin_all_inputs" ON public.inputs;
CREATE POLICY "admin_all_inputs"
ON public.inputs
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- SUPPLIERS table policies
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_rows_suppliers" ON public.suppliers;
CREATE POLICY "own_rows_suppliers"
ON public.suppliers
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "admin_all_suppliers" ON public.suppliers;
CREATE POLICY "admin_all_suppliers"
ON public.suppliers
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- CLIENTS table policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_rows_clients" ON public.clients;
CREATE POLICY "own_rows_clients"
ON public.clients
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "admin_all_clients" ON public.clients;
CREATE POLICY "admin_all_clients"
ON public.clients
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- PREMISES table policies
ALTER TABLE public.premises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_rows_premises" ON public.premises;
CREATE POLICY "own_rows_premises"
ON public.premises
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "admin_all_premises" ON public.premises;
CREATE POLICY "admin_all_premises"
ON public.premises
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- SIMULATIONS table policies
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_rows_simulations" ON public.simulations;
CREATE POLICY "own_rows_simulations"
ON public.simulations
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "admin_all_simulations" ON public.simulations;
CREATE POLICY "admin_all_simulations"
ON public.simulations
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- SIMULATION_RESULTS table policies
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_rows_simulation_results" ON public.simulation_results;
CREATE POLICY "own_rows_simulation_results"
ON public.simulation_results
FOR ALL
USING (EXISTS (SELECT 1 FROM public.simulations s WHERE s.id = simulation_results.simulation_id AND s.created_by = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.simulations s WHERE s.id = simulation_results.simulation_id AND s.created_by = auth.uid()));

DROP POLICY IF EXISTS "admin_all_simulation_results" ON public.simulation_results;
CREATE POLICY "admin_all_simulation_results"
ON public.simulation_results
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));