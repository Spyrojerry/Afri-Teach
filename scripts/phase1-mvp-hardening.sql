-- Phase 1 MVP hardening for the restored AfriTeach database.

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS country_flag text;

ALTER TABLE public.teacher_availability
  ADD COLUMN IF NOT EXISTS recurring_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specific_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS break_periods jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.teacher_availability
  ALTER COLUMN start_time DROP NOT NULL,
  ALTER COLUMN end_time DROP NOT NULL,
  ALTER COLUMN effective_from DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS teacher_availability_teacher_unique
  ON public.teacher_availability (teacher_id);

ALTER TABLE public.bookings
  ALTER COLUMN lesson_id DROP NOT NULL,
  ALTER COLUMN status SET DEFAULT 'confirmed';

CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_teacher_slot_unique
  ON public.bookings (teacher_id, start_time_utc, end_time_utc)
  WHERE status IN ('pending', 'confirmed');

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_availability_service_policy ON public.teacher_availability;
DROP POLICY IF EXISTS teacher_availability_self_policy ON public.teacher_availability;
DROP POLICY IF EXISTS "Availability is publicly readable" ON public.teacher_availability;
DROP POLICY IF EXISTS "Teachers manage their availability" ON public.teacher_availability;
CREATE POLICY "Availability is publicly readable"
  ON public.teacher_availability FOR SELECT
  USING (true);
CREATE POLICY "Teachers manage their availability"
  ON public.teacher_availability FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Students create booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Participants read booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Teachers respond to booking requests" ON public.booking_requests;
CREATE POLICY "Students create booking requests"
  ON public.booking_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants read booking requests"
  ON public.booking_requests FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = teacher_id);
CREATE POLICY "Teachers respond to booking requests"
  ON public.booking_requests FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Participants read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Students create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Participants update bookings" ON public.bookings;
CREATE POLICY "Participants read bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = teacher_id);
CREATE POLICY "Students create bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = student_id OR auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Learning modules are readable" ON public.learning_modules;
CREATE POLICY "Learning modules are readable"
  ON public.learning_modules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Students manage their progress" ON public.student_progress;
CREATE POLICY "Students manage their progress"
  ON public.student_progress FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Subjects are readable" ON public.subjects;
CREATE POLICY "Subjects are readable"
  ON public.subjects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Lessons are readable" ON public.lessons;
DROP POLICY IF EXISTS "Teachers manage their lessons" ON public.lessons;
CREATE POLICY "Lessons are readable"
  ON public.lessons FOR SELECT
  USING (true);
CREATE POLICY "Teachers manage their lessons"
  ON public.lessons FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Users read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete their notifications" ON public.notifications;
CREATE POLICY "Users read their notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update their notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_booking(
  p_teacher_id uuid,
  p_subject text,
  p_start_time_utc timestamptz,
  p_end_time_utc timestamptz,
  p_module_id text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid := auth.uid();
  v_booking public.bookings;
  v_student_name text;
  v_teacher_name text;
  v_teacher_tz text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_availability public.teacher_availability;
BEGIN
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_end_time_utc <= p_start_time_utc OR p_start_time_utc <= now() THEN
    RAISE EXCEPTION 'Invalid lesson time';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM students WHERE id = v_student_id) THEN
    RAISE EXCEPTION 'Only students can create bookings';
  END IF;

  SELECT COALESCE(time_zone, 'UTC')
    INTO v_teacher_tz FROM teachers WHERE id = p_teacher_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Teacher not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_teacher_tz) THEN
    v_teacher_tz := 'UTC';
  END IF;

  v_local_start := p_start_time_utc AT TIME ZONE v_teacher_tz;
  v_local_end := p_end_time_utc AT TIME ZONE v_teacher_tz;
  SELECT * INTO v_availability
  FROM teacher_availability
  WHERE teacher_id = p_teacher_id;

  IF NOT FOUND OR NOT (
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_availability.recurring_slots) slot
      WHERE (slot->>'dayOfWeek')::int = extract(dow FROM v_local_start)::int
        AND slot->>'startTime' = to_char(v_local_start, 'HH24:MI')
        AND slot->>'endTime' = to_char(v_local_end, 'HH24:MI')
    )
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_availability.specific_dates) day_entry,
           jsonb_array_elements(COALESCE(day_entry->'slots', '[]'::jsonb)) slot
      WHERE day_entry->>'date' = to_char(v_local_start, 'YYYY-MM-DD')
        AND slot->>'startTime' = to_char(v_local_start, 'HH24:MI')
        AND slot->>'endTime' = to_char(v_local_end, 'HH24:MI')
    )
  ) THEN
    RAISE EXCEPTION 'The selected time is not in the teacher availability';
  END IF;

  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE teacher_id = p_teacher_id
      AND status IN ('pending', 'confirmed')
      AND tstzrange(start_time_utc, end_time_utc, '[)')
          && tstzrange(p_start_time_utc, p_end_time_utc, '[)')
  ) THEN
    RAISE EXCEPTION 'This time slot has already been booked';
  END IF;

  INSERT INTO bookings (
    student_id, teacher_id, subject, module_id, date,
    start_time, end_time, start_time_utc, end_time_utc,
    status, notes
  )
  VALUES (
    v_student_id, p_teacher_id, p_subject, p_module_id,
    (p_start_time_utc AT TIME ZONE 'UTC')::date,
    p_start_time_utc, p_end_time_utc, p_start_time_utc, p_end_time_utc,
    'confirmed', COALESCE(p_notes, '')
  )
  RETURNING * INTO v_booking;

  v_booking.meeting_link :=
    'https://meet.jit.si/afriteach-' || replace(v_booking.id::text, '-', '');
  UPDATE bookings
  SET meeting_link = v_booking.meeting_link,
      virtual_classroom_link = v_booking.meeting_link
  WHERE id = v_booking.id;

  SELECT concat_ws(' ', first_name, last_name)
    INTO v_student_name FROM students WHERE id = v_student_id;
  SELECT concat_ws(' ', first_name, last_name)
    INTO v_teacher_name FROM teachers WHERE id = p_teacher_id;

  INSERT INTO notifications (user_id, title, type, message, related_id, related_entity_type)
  VALUES
    (p_teacher_id, 'New lesson booked', 'booking_confirmation',
     v_student_name || ' booked a ' || p_subject || ' lesson.', v_booking.id, 'booking'),
    (v_student_id, 'Booking confirmed', 'booking_confirmation',
     'Your ' || p_subject || ' lesson with ' || v_teacher_name || ' is confirmed.',
     v_booking.id, 'booking');

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking(uuid, text, timestamptz, timestamptz, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, text, timestamptz, timestamptz, text, text) TO authenticated;
