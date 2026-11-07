
-- Create custom_themes table
CREATE TABLE public.custom_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  colors jsonb NOT NULL,
  hero jsonb NOT NULL DEFAULT '{}',
  hero_image_url text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.custom_themes ENABLE ROW LEVEL SECURITY;

-- Admin-only policies using has_role function
CREATE POLICY "Admins can manage custom themes"
  ON public.custom_themes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view custom themes"
  ON public.custom_themes FOR SELECT
  USING (true);

-- Create theme-assets storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('theme-assets', 'theme-assets', true);

-- Storage policies for theme assets
CREATE POLICY "Anyone can view theme assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'theme-assets');

CREATE POLICY "Admins can upload theme assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'theme-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update theme assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'theme-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete theme assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'theme-assets' AND public.has_role(auth.uid(), 'admin'));
