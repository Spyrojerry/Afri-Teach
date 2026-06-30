-- End-to-end encrypted messaging support for AfriTeach.
-- Run this in Supabase after the base schema.

CREATE TABLE IF NOT EXISTS public.message_encryption_keys (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  public_key_jwk jsonb NOT NULL,
  key_algorithm text NOT NULL DEFAULT 'ECDH-P-256',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS encrypted_payload jsonb,
  ADD COLUMN IF NOT EXISTS encryption_version text;

CREATE INDEX IF NOT EXISTS messages_sender_receiver_sent_at_idx
  ON public.messages (sender_id, receiver_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS messages_receiver_sender_sent_at_idx
  ON public.messages (receiver_id, sender_id, sent_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_encryption_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read their messages" ON public.messages;
CREATE POLICY "Participants read their messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users send their own messages" ON public.messages;
CREATE POLICY "Users send their own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Receivers mark messages as read" ON public.messages;
CREATE POLICY "Receivers mark messages as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Authenticated users read public message keys" ON public.message_encryption_keys;
CREATE POLICY "Authenticated users read public message keys"
  ON public.message_encryption_keys FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users create their own message key" ON public.message_encryption_keys;
CREATE POLICY "Users create their own message key"
  ON public.message_encryption_keys FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own message key" ON public.message_encryption_keys;
CREATE POLICY "Users update their own message key"
  ON public.message_encryption_keys FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END;
$$;
