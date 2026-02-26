-- Enable realtime for jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- Create a function for admins to manage roles
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id UUID, new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role('admin', auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can manage roles';
  END IF;
  
  -- Upsert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Create a function for admins to remove a role
CREATE OR REPLACE FUNCTION public.admin_remove_user_role(target_user_id UUID, remove_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role('admin', auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can manage roles';
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = remove_role;
END;
$$;