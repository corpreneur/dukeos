
-- Add yard_size_sqft to service_addresses
ALTER TABLE public.service_addresses ADD COLUMN IF NOT EXISTS yard_size_sqft integer;

-- Service Areas table for zip code validation
CREATE TABLE public.service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code text NOT NULL UNIQUE,
  city text,
  state text DEFAULT 'TX',
  active boolean NOT NULL DEFAULT true,
  org_id uuid REFERENCES public.organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage service areas" ON public.service_areas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active service areas" ON public.service_areas FOR SELECT
  USING (active = true);

-- GBP Integrations table
CREATE TABLE public.gbp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  admin_user_id uuid NOT NULL,
  gbp_location_id text NOT NULL,
  gbp_account_name text,
  access_token text,
  refresh_token text,
  is_active boolean NOT NULL DEFAULT true,
  auto_review_request boolean NOT NULL DEFAULT true,
  review_request_delay_hours integer NOT NULL DEFAULT 24,
  review_request_template text DEFAULT 'Hi {{customer_name}}! Thanks for choosing Scoop Duke. We''d love your feedback — please leave us a review: {{review_link}}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gbp_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage GBP integrations" ON public.gbp_integrations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gbp_integration_id uuid NOT NULL REFERENCES public.gbp_integrations(id) ON DELETE CASCADE,
  review_id text UNIQUE NOT NULL,
  reviewer_name text,
  star_rating integer NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  comment text,
  reply text,
  review_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Pricing tiers table (yard size based)
CREATE TABLE public.pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_type text NOT NULL DEFAULT 'yard_size',
  label text NOT NULL,
  min_value integer NOT NULL DEFAULT 0,
  max_value integer NOT NULL DEFAULT 0,
  surcharge_cents integer NOT NULL DEFAULT 0,
  org_id uuid REFERENCES public.organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pricing tiers" ON public.pricing_tiers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view pricing tiers" ON public.pricing_tiers FOR SELECT
  USING (true);

-- Seed default yard size tiers
INSERT INTO public.pricing_tiers (tier_type, label, min_value, max_value, surcharge_cents) VALUES
  ('yard_size', 'Small', 0, 2000, 0),
  ('yard_size', 'Medium', 2001, 5000, 500),
  ('yard_size', 'Large', 5001, 99999, 1200);

-- Seed some default service areas (DFW)
INSERT INTO public.service_areas (zip_code, city, state) VALUES
  ('75069', 'McKinney', 'TX'),
  ('75070', 'McKinney', 'TX'),
  ('75071', 'McKinney', 'TX'),
  ('75034', 'Frisco', 'TX'),
  ('75035', 'Frisco', 'TX'),
  ('75013', 'Allen', 'TX'),
  ('75002', 'Allen', 'TX'),
  ('75023', 'Plano', 'TX'),
  ('75024', 'Plano', 'TX'),
  ('75025', 'Plano', 'TX'),
  ('75078', 'Prosper', 'TX'),
  ('75009', 'Celina', 'TX'),
  ('75454', 'Melissa', 'TX'),
  ('75407', 'Princeton', 'TX'),
  ('75068', 'Little Elm', 'TX');
