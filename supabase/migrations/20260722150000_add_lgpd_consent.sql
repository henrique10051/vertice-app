ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;

-- Capture LGPD consent (passed as user metadata on signUp) at profile-creation time,
-- since the client may have no session yet when email confirmation is pending.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, onboarding_completed, consent_accepted_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    CASE WHEN NEW.raw_user_meta_data->>'consent_accepted' = 'true' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    consent_accepted_at = COALESCE(profiles.consent_accepted_at, EXCLUDED.consent_accepted_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
