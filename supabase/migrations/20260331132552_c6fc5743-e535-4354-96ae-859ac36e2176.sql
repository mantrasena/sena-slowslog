
-- Create invite_codes table
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed for signup validation)
CREATE POLICY "Invite codes readable by everyone" ON public.invite_codes
  FOR SELECT TO public USING (true);

-- Founders can manage
CREATE POLICY "Founders can manage invite codes" ON public.invite_codes
  FOR ALL TO public USING (has_role(auth.uid(), 'founder'::app_role));

-- Admins can manage
CREATE POLICY "Admins can manage invite codes" ON public.invite_codes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to validate and use an invite code
CREATE OR REPLACE FUNCTION public.use_invite_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.invite_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
    AND (max_uses IS NULL OR used_count < max_uses);

  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.invite_codes
  SET used_count = used_count + 1
  WHERE id = v_id;

  RETURN true;
END;
$$;
