
-- Table for team members with granular permissions
CREATE TABLE public.admin_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '{"orders": false, "products": false, "full_access": false}'::jsonb,
  invited_by uuid,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage team members"
  ON public.admin_team_members FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view their own record"
  ON public.admin_team_members FOR SELECT
  USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE TRIGGER update_admin_team_members_updated_at
  BEFORE UPDATE ON public.admin_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table for OTP verifications
CREATE TABLE public.admin_otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  otp_code text NOT NULL,
  action_type text NOT NULL,
  action_payload jsonb,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage OTP verifications"
  ON public.admin_otp_verifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
