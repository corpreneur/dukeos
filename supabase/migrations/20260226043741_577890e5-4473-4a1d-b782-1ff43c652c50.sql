
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'technician', 'customer');
CREATE TYPE public.job_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.proof_type AS ENUM ('before', 'after');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Service addresses table
CREATE TABLE public.service_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL DEFAULT 'Home',
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'NC',
  zip TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_addresses ENABLE ROW LEVEL SECURITY;

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address_id UUID REFERENCES public.service_addresses(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'basic',
  frequency TEXT NOT NULL DEFAULT 'weekly',
  price_cents INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  technician_id UUID REFERENCES auth.users(id),
  address_id UUID REFERENCES public.service_addresses(id) NOT NULL,
  status job_status NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Job proofs table
CREATE TABLE public.job_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  proof_type proof_type NOT NULL,
  image_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_proofs ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_addresses_updated_at BEFORE UPDATE ON public.service_addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Service addresses
CREATE POLICY "Customers view own addresses" ON public.service_addresses FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Customers manage own addresses" ON public.service_addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update own addresses" ON public.service_addresses FOR UPDATE TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Customers delete own addresses" ON public.service_addresses FOR DELETE TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Admins view all addresses" ON public.service_addresses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Technicians view assigned job addresses" ON public.service_addresses FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.address_id = service_addresses.id AND jobs.technician_id = auth.uid())
);

-- Subscriptions
CREATE POLICY "Customers view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Customers create own subscriptions" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins manage all subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Jobs
CREATE POLICY "Customers view own jobs" ON public.jobs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.subscriptions WHERE subscriptions.id = jobs.subscription_id AND subscriptions.customer_id = auth.uid())
);
CREATE POLICY "Technicians view assigned jobs" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = technician_id);
CREATE POLICY "Technicians update assigned jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = technician_id);
CREATE POLICY "Admins manage all jobs" ON public.jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Job proofs
CREATE POLICY "Technicians insert proofs" ON public.job_proofs FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = uploaded_by AND EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_proofs.job_id AND jobs.technician_id = auth.uid())
);
CREATE POLICY "Proof viewers" ON public.job_proofs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_proofs.job_id AND (jobs.technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.subscriptions WHERE subscriptions.id = jobs.subscription_id AND subscriptions.customer_id = auth.uid())))
  OR public.has_role(auth.uid(), 'admin')
);

-- Storage bucket for job proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('job-proofs', 'job-proofs', false);

CREATE POLICY "Technicians upload proofs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'job-proofs' AND public.has_role(auth.uid(), 'technician'));

CREATE POLICY "Authenticated users view proofs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'job-proofs');
