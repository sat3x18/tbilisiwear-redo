
-- Bank accounts table for payment settings
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  iban TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage bank accounts" ON public.bank_accounts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active bank accounts
CREATE POLICY "Anyone can view active bank accounts" ON public.bank_accounts
  FOR SELECT USING (is_active = true);

-- Insert default bank accounts
INSERT INTO public.bank_accounts (bank_name, iban, display_order) VALUES
  ('TBC Bank', 'GE30TB7843045061100097', 0),
  ('Bank of Georgia', 'GE33BG0000000183812500', 1);

-- Insert default store settings for payments and social media
INSERT INTO public.store_settings (key, value) VALUES
  ('payments_enabled', 'true'),
  ('social_instagram', ''),
  ('social_facebook', ''),
  ('social_tiktok', ''),
  ('social_messenger', '')
ON CONFLICT DO NOTHING;
