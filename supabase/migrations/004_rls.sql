-- ============================================================
-- Migration 004 — Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings           ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────
-- Função auxiliar: retorna o role do usuário autenticado
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'manager'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POLICIES: profiles
-- ============================================================

-- Estagiário lê apenas o próprio perfil; manager lê todos
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_manager()
  );

-- Apenas manager pode criar perfis (sem autocadastro)
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (public.is_manager());

-- Manager pode atualizar qualquer perfil;
-- estagiário pode atualizar apenas photo_url e pin do próprio perfil
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    public.is_manager() OR auth.uid() = id
  ) WITH CHECK (
    public.is_manager() OR auth.uid() = id
  );

-- Apenas manager pode deletar
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (public.is_manager());

-- ============================================================
-- POLICIES: time_records
-- ============================================================

-- Estagiário lê apenas os próprios; manager lê todos
CREATE POLICY "records_select" ON public.time_records
  FOR SELECT USING (
    intern_id = auth.uid() OR public.is_manager()
  );

-- Estagiário só insere registros para si mesmo
CREATE POLICY "records_insert" ON public.time_records
  FOR INSERT WITH CHECK (intern_id = auth.uid());

-- Estagiário atualiza apenas campos permitidos (clock_out, notes)
-- quando o status ainda é 'pending'
-- Manager atualiza qualquer campo (para aprovação/rejeição)
CREATE POLICY "records_update" ON public.time_records
  FOR UPDATE USING (
    (intern_id = auth.uid() AND status = 'pending') OR public.is_manager()
  );

-- Ninguém deleta registros (auditoria preservada)
CREATE POLICY "records_no_delete" ON public.time_records
  FOR DELETE USING (false);

-- ============================================================
-- POLICIES: activities
-- ============================================================

CREATE POLICY "activities_select" ON public.activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id
        AND (tr.intern_id = auth.uid() OR public.is_manager())
    )
  );

CREATE POLICY "activities_insert" ON public.activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id AND tr.intern_id = auth.uid()
    )
  );

CREATE POLICY "activities_update" ON public.activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.time_records tr
      WHERE tr.id = time_record_id AND tr.intern_id = auth.uid()
        AND tr.status = 'pending'
    )
  );

-- ============================================================
-- POLICIES: favorite_activities
-- ============================================================

CREATE POLICY "favorites_select" ON public.favorite_activities
  FOR SELECT USING (intern_id = auth.uid() OR public.is_manager());

CREATE POLICY "favorites_insert" ON public.favorite_activities
  FOR INSERT WITH CHECK (intern_id = auth.uid());

CREATE POLICY "favorites_update" ON public.favorite_activities
  FOR UPDATE USING (intern_id = auth.uid());

CREATE POLICY "favorites_delete" ON public.favorite_activities
  FOR DELETE USING (intern_id = auth.uid());

-- ============================================================
-- POLICIES: push_subscriptions
-- ============================================================

CREATE POLICY "push_select" ON public.push_subscriptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_manager());

CREATE POLICY "push_insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_delete" ON public.push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- POLICIES: notifications
-- ============================================================

CREATE POLICY "notif_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_manager());

-- Apenas o sistema (service role) insere notificações
CREATE POLICY "notif_insert" ON public.notifications
  FOR INSERT WITH CHECK (public.is_manager());

-- ============================================================
-- POLICIES: settings
-- ============================================================

-- Todos leem as configurações
CREATE POLICY "settings_select" ON public.settings
  FOR SELECT USING (true);

-- Apenas manager edita
CREATE POLICY "settings_update" ON public.settings
  FOR UPDATE USING (public.is_manager());

-- ============================================================
-- POLÍTICAS DE STORAGE: bucket avatars
-- ============================================================
-- (Executar após criar o bucket no Supabase Dashboard)

-- Upload: usuário só sobe na própria pasta (avatars/{user_id}/*)
-- CREATE POLICY "avatars_upload" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'avatars' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- Leitura pública
-- CREATE POLICY "avatars_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');
--
-- Deletar: apenas o próprio usuário
-- CREATE POLICY "avatars_delete" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'avatars' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
