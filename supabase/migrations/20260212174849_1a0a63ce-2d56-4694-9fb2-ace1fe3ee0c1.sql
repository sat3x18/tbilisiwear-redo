
-- Drop the restrictive policies
DROP POLICY IF EXISTS "Admins can manage team members" ON public.admin_team_members;
DROP POLICY IF EXISTS "Team members can view their own record" ON public.admin_team_members;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage team members"
ON public.admin_team_members
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view their own record"
ON public.admin_team_members
FOR SELECT
TO authenticated
USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())::text));
