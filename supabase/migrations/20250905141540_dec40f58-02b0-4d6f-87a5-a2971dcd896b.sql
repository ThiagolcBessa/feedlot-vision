-- Fix function search path warnings for security compliance
-- Update existing functions to have proper search_path settings

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
begin
  -- usa o mesmo UUID do auth em id e user_id
  insert into public.profiles (id, user_id, role)
  values (new.id, new.id, 'originator')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Update the set_created_by function
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;