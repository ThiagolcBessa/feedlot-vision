-- Fix security vulnerability: Restrict unit_price_matrix access to authenticated users only
-- Remove the overly permissive policy that allows public access
DROP POLICY "upm_read_all" ON public.unit_price_matrix;

-- Create a new policy that only allows authenticated users to read pricing data
CREATE POLICY "upm_read_authenticated_only" 
ON public.unit_price_matrix 
FOR SELECT 
USING (auth.uid() IS NOT NULL);