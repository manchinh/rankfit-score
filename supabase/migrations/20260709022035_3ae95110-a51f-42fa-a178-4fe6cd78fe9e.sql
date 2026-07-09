
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  country TEXT NOT NULL DEFAULT 'Unknown',
  date_of_birth DATE,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  avatar_url TEXT,
  current_score INTEGER NOT NULL DEFAULT 0,
  personal_best_score INTEGER NOT NULL DEFAULT 0,
  highest_global_rank INTEGER,
  highest_country_rank INTEGER,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  days_above_900 INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  last_active_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are readable by anyone (public leaderboard)"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users delete their own profile"
  ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- HEALTH DATA (daily entries)
CREATE TABLE public.health_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  active_minutes INTEGER NOT NULL DEFAULT 0,
  sleep_hours NUMERIC NOT NULL DEFAULT 0,
  weight_kg NUMERIC,
  bmi NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_entries TO authenticated;
GRANT ALL ON public.health_entries TO service_role;
ALTER TABLE public.health_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health entries"
  ON public.health_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX health_entries_user_date_idx ON public.health_entries(user_id, entry_date DESC);

-- SCORE HISTORY
CREATE TABLE public.score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  current_score INTEGER NOT NULL,
  personal_best INTEGER NOT NULL,
  activity_score INTEGER NOT NULL DEFAULT 0,
  distance_score INTEGER NOT NULL DEFAULT 0,
  active_minutes_score INTEGER NOT NULL DEFAULT 0,
  consistency_score INTEGER NOT NULL DEFAULT 0,
  sleep_score INTEGER NOT NULL DEFAULT 0,
  bmi_score INTEGER NOT NULL DEFAULT 0,
  change_delta INTEGER NOT NULL DEFAULT 0,
  change_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, score_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_history TO authenticated;
GRANT ALL ON public.score_history TO service_role;
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own score history"
  ON public.score_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX score_history_user_date_idx ON public.score_history(user_id, score_date DESC);

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements readable by anyone"
  ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Users insert own achievements"
  ON public.achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own achievements"
  ON public.achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DAILY CHALLENGES
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  challenge_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target NUMERIC NOT NULL,
  progress NUMERIC NOT NULL DEFAULT 0,
  reward_points INTEGER NOT NULL DEFAULT 5,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_date, challenge_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own challenges"
  ON public.challenges FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_health_updated BEFORE UPDATE ON public.health_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'country', 'Unknown')
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
