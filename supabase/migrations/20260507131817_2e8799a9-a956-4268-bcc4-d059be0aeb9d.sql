
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Anyone authenticated can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- Team settings (singleton row)
CREATE TABLE public.team_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Meu Time',
  logo_url TEXT,
  description TEXT,
  founded_year INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.team_settings (name) VALUES ('Meu Time');

CREATE POLICY "Public can view team" ON public.team_settings FOR SELECT USING (true);
CREATE POLICY "Admins update team" ON public.team_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert team" ON public.team_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Players
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nickname TEXT,
  position TEXT,
  jersey_number INTEGER,
  photo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Admins manage players" ON public.players FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_date DATE NOT NULL,
  opponent TEXT NOT NULL,
  our_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admins manage matches" ON public.matches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Participations (who played)
CREATE TABLE public.match_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  UNIQUE (match_id, player_id)
);
ALTER TABLE public.match_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view participations" ON public.match_participations FOR SELECT USING (true);
CREATE POLICY "Admins manage participations" ON public.match_participations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Goals
CREATE TABLE public.match_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  goals INTEGER NOT NULL DEFAULT 1 CHECK (goals > 0),
  UNIQUE (match_id, player_id)
);
ALTER TABLE public.match_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view goals" ON public.match_goals FOR SELECT USING (true);
CREATE POLICY "Admins manage goals" ON public.match_goals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('team', 'team', true);

CREATE POLICY "Public read team bucket" ON storage.objects FOR SELECT USING (bucket_id = 'team');
CREATE POLICY "Admins upload team bucket" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update team bucket" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'team' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete team bucket" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'team' AND public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to first user that signs up
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_admin();
