-- 1. ADIÇÃO DE COLUNAS NA TABELA PLAYERS
-- Vincula o jogador a um usuário do sistema (auth.users)
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

-- Adiciona a coluna de email para permitir o cadastro
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS email text;

-- 2. CONFIGURAÇÃO DO STATUS DE PRESENÇA
-- Cria o tipo de dado para a confirmação (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE public.attendance_status AS ENUM ('vou', 'nao_vou', 'talvez');
    END IF;
END $$;

-- 3. CRIAÇÃO DA TABELA DE CONFIRMAÇÕES (MATCH_ATTENDANCE)
CREATE TABLE IF NOT EXISTS public.match_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid NOT NULL,
    player_id uuid NOT NULL,
    status public.attendance_status NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (match_id, player_id)
);

-- 4. SEGURANÇA (RLS - ROW LEVEL SECURITY)
ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver quem vai ao jogo
DROP POLICY IF EXISTS "Authenticated view attendance" ON public.match_attendance;
CREATE POLICY "Authenticated view attendance"
ON public.match_attendance FOR SELECT
TO authenticated USING (true);

-- Política: Admins podem gerenciar todas as confirmações
DROP POLICY IF EXISTS "Admins manage attendance" ON public.match_attendance;
CREATE POLICY "Admins manage attendance"
ON public.match_attendance FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política: O jogador só pode inserir/editar/deletar a PRÓPRIA presença
DROP POLICY IF EXISTS "Player insert own attendance" ON public.match_attendance;
CREATE POLICY "Player insert own attendance"
ON public.match_attendance FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.players p WHERE p.id = match_attendance.player_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Player update own attendance" ON public.match_attendance;
CREATE POLICY "Player update own attendance"
ON public.match_attendance FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id = match_attendance.player_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.players p WHERE p.id = match_attendance.player_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Player delete own attendance" ON public.match_attendance;
CREATE POLICY "Player delete own attendance"
ON public.match_attendance FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id = match_attendance.player_id AND p.user_id = auth.uid()));

-- Política: Permite que um usuário "reivindique" um jogador que está sem dono
DROP POLICY IF EXISTS "User claim unowned player" ON public.players;
CREATE POLICY "User claim unowned player"
ON public.players FOR UPDATE
TO authenticated
USING (user_id IS NULL OR user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. AUTOMAÇÃO (TRIGGER PARA DATA DE ATUALIZAÇÃO)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN 
    NEW.updated_at = now(); 
    RETURN NEW; 
END $$;

DROP TRIGGER IF EXISTS trg_attendance_touch ON public.match_attendance;
CREATE TRIGGER trg_attendance_touch BEFORE UPDATE ON public.match_attendance
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();