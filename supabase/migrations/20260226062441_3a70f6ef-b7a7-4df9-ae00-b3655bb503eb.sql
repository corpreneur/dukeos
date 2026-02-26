
-- Add num_dogs to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS num_dogs integer NOT NULL DEFAULT 1;

-- Add density_score to service_addresses (0-100)
ALTER TABLE public.service_addresses ADD COLUMN IF NOT EXISTS density_score integer DEFAULT 0;

-- Yard issues table for technician reporting
CREATE TABLE public.yard_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL,
  issue_type text NOT NULL, -- 'long_grass', 'broken_fence', 'pest_infestation', 'broken_sprinkler', 'other'
  notes text,
  photo_url text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.yard_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all yard issues"
  ON public.yard_issues FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Techs insert yard issues"
  ON public.yard_issues FOR INSERT
  WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "Techs view own yard issues"
  ON public.yard_issues FOR SELECT
  USING (auth.uid() = technician_id);

CREATE POLICY "Customers view yard issues for their jobs"
  ON public.yard_issues FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM jobs j
    JOIN subscriptions s ON s.id = j.subscription_id
    WHERE j.id = yard_issues.job_id AND s.customer_id = auth.uid()
  ));

-- Notifications table for SMS/push logging
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'sms_upsell', 'tech_en_route', 'job_assigned', 'gate_alert'
  channel text NOT NULL DEFAULT 'sms', -- 'sms', 'push', 'email'
  title text,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all notifications"
  ON public.notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Gate verification results table
CREATE TABLE public.gate_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_proof_id uuid NOT NULL REFERENCES public.job_proofs(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  gate_detected boolean NOT NULL DEFAULT false,
  latch_secure boolean NOT NULL DEFAULT false,
  confidence_score numeric(5,4) DEFAULT 0,
  ai_response jsonb,
  verified_at timestamptz NOT NULL DEFAULT now(),
  admin_alerted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gate_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gate verifications"
  ON public.gate_verifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Techs view own gate verifications"
  ON public.gate_verifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = gate_verifications.job_id AND jobs.technician_id = auth.uid()
  ));

-- Add realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
