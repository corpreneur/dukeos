
-- Organizations table for multi-tenant support
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  logo_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Org memberships
CREATE TABLE public.org_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Add org_id to key tables for data isolation
ALTER TABLE public.subscriptions ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.jobs ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.service_addresses ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Org policies
CREATE POLICY "Members can view their org"
  ON public.organizations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_members WHERE org_id = organizations.id AND user_id = auth.uid()
  ));

CREATE POLICY "Owners can update their org"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create orgs"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Org members policies
CREATE POLICY "Members can view org members"
  ON public.org_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_members AS om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid()
  ));

CREATE POLICY "Org owners can manage members"
  ON public.org_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.organizations WHERE id = org_members.org_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert themselves"
  ON public.org_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins bypass
CREATE POLICY "Admins manage all orgs"
  ON public.organizations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage all org members"
  ON public.org_members FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Push notification subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all push subs"
  ON public.push_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Offline sync queue table
CREATE TABLE public.offline_sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ
);

ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sync queue"
  ON public.offline_sync_queue FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
