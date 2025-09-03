-- Create triggers to auto-fill created_by = auth.uid() on INSERT when null
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Add triggers to all tables with created_by
CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON public.simulations
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON public.premises
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON public.inputs
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();