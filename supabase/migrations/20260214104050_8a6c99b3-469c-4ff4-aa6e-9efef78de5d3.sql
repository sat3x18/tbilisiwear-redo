
DROP POLICY IF EXISTS "Team members can view their own record" ON public.admin_team_members;

CREATE POLICY "Team members can view their own record"
ON public.admin_team_members
FOR SELECT
TO authenticated
USING (lower(email) = lower(auth.jwt() ->> 'email'));
