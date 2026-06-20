-- ============================================================
-- 020 · Módulo Atualizações + Feedback dos Alunos
-- ============================================================

-- Tabela de novidades/changelog do sistema (gerenciada pelo admin)
CREATE TABLE IF NOT EXISTS public.system_updates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'feature'
              CHECK (type IN ('feature', 'fix', 'improvement', 'announcement')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de feedbacks enviados pelos alunos
CREATE TABLE IF NOT EXISTS public.feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL DEFAULT 'suggestion'
              CHECK (category IN ('suggestion', 'bug', 'praise', 'other')),
  message     TEXT        NOT NULL CHECK (length(trim(message)) >= 10),
  status      TEXT        NOT NULL DEFAULT 'new'
              CHECK (status IN ('new', 'read', 'implemented', 'archived')),
  admin_reply TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback        ENABLE ROW LEVEL SECURITY;

-- system_updates: qualquer autenticado pode ler, só manager pode inserir
CREATE POLICY "system_updates_read"   ON public.system_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "system_updates_insert" ON public.system_updates FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "system_updates_delete" ON public.system_updates FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
);

-- feedback: aluno vê/cria apenas o seu; manager vê todos
CREATE POLICY "feedback_intern_select" ON public.feedback FOR SELECT TO authenticated USING (
  intern_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "feedback_intern_insert" ON public.feedback FOR INSERT TO authenticated WITH CHECK (
  intern_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'intern')
);
CREATE POLICY "feedback_manager_update" ON public.feedback FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
);

-- Novidades iniciais do sistema
INSERT INTO public.system_updates (title, description, type, created_at) VALUES
  ('Módulo de Relatórios lançado',      'Gere relatórios em Excel e PDF com filtros por mês e estagiário diretamente no painel admin.', 'feature',      NOW() - INTERVAL '10 days'),
  ('Sistema de pontuação e níveis',     'Cada presença, pontualidade e atividade registrada gera pontos. Suba de nível e apareça no ranking!', 'feature', NOW() - INTERVAL '8 days'),
  ('Conquistas desbloqueadas',          'Complete metas para ganhar medalhas: foto de perfil, nome completo, sequência de dias e muito mais.', 'improvement', NOW() - INTERVAL '5 days'),
  ('Ícones modernizados no sistema',    'Todos os módulos agora usam ícones minimalistas no lugar de emojis, deixando a interface mais limpa.', 'improvement', NOW() - INTERVAL '2 days'),
  ('Módulo Atualizações disponível',    'Agora você pode ver as novidades do sistema e enviar sugestões diretamente pelo seu painel.', 'feature',      NOW())
ON CONFLICT DO NOTHING;
