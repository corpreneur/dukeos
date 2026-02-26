
-- Time tracking: clock in/out per job
CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all time entries" ON public.time_entries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Techs view own time entries" ON public.time_entries FOR SELECT TO authenticated
  USING (auth.uid() = technician_id);

CREATE POLICY "Techs insert own time entries" ON public.time_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "Techs update own time entries" ON public.time_entries FOR UPDATE TO authenticated
  USING (auth.uid() = technician_id);

-- Technician skills/certifications
CREATE TABLE public.technician_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL,
  skill text NOT NULL,
  certified boolean NOT NULL DEFAULT false,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(technician_id, skill)
);

ALTER TABLE public.technician_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all skills" ON public.technician_skills FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Techs view own skills" ON public.technician_skills FOR SELECT TO authenticated
  USING (auth.uid() = technician_id);

-- Technician availability / schedule
CREATE TABLE public.technician_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '17:00',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(technician_id, day_of_week)
);

ALTER TABLE public.technician_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all availability" ON public.technician_availability FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Techs view own availability" ON public.technician_availability FOR SELECT TO authenticated
  USING (auth.uid() = technician_id);

CREATE POLICY "Techs manage own availability" ON public.technician_availability FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = technician_id);

CREATE POLICY "Techs update own availability" ON public.technician_availability FOR UPDATE TO authenticated
  USING (auth.uid() = technician_id);

-- Enable realtime for time_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
