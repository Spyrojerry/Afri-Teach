-- Teacher application and admin review workflow for AfriTeach.
-- Run this after the base schema and phase1-mvp-hardening.sql.

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS application_status text NOT NULL DEFAULT 'draft'
    CHECK (application_status IN ('draft', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS application_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS application_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS application_reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS application_review_notes text;

CREATE TABLE IF NOT EXISTS public.teacher_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL UNIQUE REFERENCES public.teachers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  bio text,
  experience text,
  hourly_rate numeric(10,2) DEFAULT 0,
  time_zone text NOT NULL DEFAULT 'Africa/Lagos',
  subjects text[] NOT NULL DEFAULT '{}'::text[],
  teacher_modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  application_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers read their own applications" ON public.teacher_applications;
CREATE POLICY "Teachers read their own applications"
  ON public.teacher_applications FOR SELECT TO authenticated
  USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers submit their own applications" ON public.teacher_applications;
CREATE POLICY "Teachers submit their own applications"
  ON public.teacher_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers update pending own applications" ON public.teacher_applications;
CREATE POLICY "Teachers update pending own applications"
  ON public.teacher_applications FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id AND status IN ('pending', 'rejected'))
  WITH CHECK (auth.uid() = teacher_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
CREATE POLICY "Users can insert their own record"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
CREATE POLICY "Users can update their own record"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_id
      AND role IN ('admin', 'super_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins manage teacher applications" ON public.teacher_applications;
CREATE POLICY "Admins manage teacher applications"
  ON public.teacher_applications FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins view users" ON public.users;
CREATE POLICY "Admins view users"
  ON public.users FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update teacher profiles" ON public.teachers;
CREATE POLICY "Admins update teacher profiles"
  ON public.teachers FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.review_teacher_application(
  application_id uuid,
  new_status text,
  notes text DEFAULT NULL
)
RETURNS public.teacher_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_role text;
  reviewed_application public.teacher_applications;
BEGIN
  SELECT role INTO reviewer_role
  FROM public.users
  WHERE id = auth.uid();

  IF reviewer_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only admins can review teacher applications';
  END IF;

  IF new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid review status: %', new_status;
  END IF;

  UPDATE public.teacher_applications
  SET status = new_status,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_notes = notes,
      updated_at = now()
  WHERE id = application_id
  RETURNING * INTO reviewed_application;

  IF reviewed_application.id IS NULL THEN
    RAISE EXCEPTION 'Teacher application not found';
  END IF;

  UPDATE public.teachers
  SET application_status = new_status,
      is_verified = (new_status = 'approved'),
      application_reviewed_at = now(),
      application_reviewed_by = auth.uid(),
      application_review_notes = notes,
      updated_at = now()
  WHERE id = reviewed_application.teacher_id;

  RETURN reviewed_application;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_teacher_application(uuid, text, text) TO authenticated;
