-- Fix infinite recursion in profiles RLS policies
-- The issue is that policies are referencing the same table they're applied to

-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- This function safely gets the current user's role without recursion
  RETURN (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create clean, non-recursive policies
CREATE POLICY "profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_insert_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_admin_access" 
ON public.profiles 
FOR ALL 
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');