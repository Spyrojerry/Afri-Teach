CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  privacy_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  teaching_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  language text NOT NULL DEFAULT 'english',
  time_zone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their settings" ON public.user_settings;
CREATE POLICY "Users manage their settings"
  ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
