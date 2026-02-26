
-- Service add-ons catalog
CREATE TABLE public.service_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'sparkles',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active addons" ON public.service_addons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage addons" ON public.service_addons
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add-on orders
CREATE TABLE public.addon_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  addon_id UUID NOT NULL REFERENCES public.service_addons(id),
  customer_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  job_id UUID REFERENCES public.jobs(id),
  status TEXT NOT NULL DEFAULT 'pending',
  price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.addon_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own addon orders" ON public.addon_orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers create own addon orders" ON public.addon_orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins manage all addon orders" ON public.addon_orders
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Tech live locations for ETA tracking
CREATE TABLE public.tech_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id UUID NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tech_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Techs update own location" ON public.tech_locations
  FOR ALL USING (auth.uid() = technician_id);

CREATE POLICY "Customers view assigned tech location" ON public.tech_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN subscriptions s ON s.id = j.subscription_id
      WHERE j.technician_id = tech_locations.technician_id
        AND s.customer_id = auth.uid()
        AND j.status = 'in_progress'
    )
  );

CREATE POLICY "Admins view all locations" ON public.tech_locations
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Weather alerts
CREATE TABLE public.weather_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_date DATE NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  description TEXT NOT NULL,
  affected_zip TEXT,
  auto_reschedule BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage weather alerts" ON public.weather_alerts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Techs view weather alerts" ON public.weather_alerts
  FOR SELECT USING (has_role(auth.uid(), 'technician'::app_role));

-- Enable realtime for tech locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.tech_locations;

-- Seed default add-on services
INSERT INTO public.service_addons (name, description, price_cents, icon) VALUES
  ('Yard Deodorizing', 'Professional enzyme-based deodorizing treatment for your entire yard', 3500, 'spray-can'),
  ('Sanitizing Treatment', 'Hospital-grade sanitizing spray to eliminate bacteria and parasites', 4500, 'shield-check'),
  ('Brown Spot Treatment', 'Neutralize urine burns and restore green grass', 2500, 'leaf'),
  ('Double Cleanup', 'Extra thorough cleanup — we go over every inch twice', 2000, 'refresh-cw');
