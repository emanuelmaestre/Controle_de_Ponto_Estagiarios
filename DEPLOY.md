# Checklist de Deploy — Controle de Ponto Estagiários

## 1. Supabase (banco de dados)

- [ ] Criar projeto em https://supabase.com/dashboard
- [ ] Executar as migrations em ordem no SQL Editor:
  ```
  supabase/migrations/001_schema.sql
  supabase/migrations/002_triggers.sql
  supabase/migrations/003_views.sql
  supabase/migrations/004_rls.sql
  supabase/migrations/005_indexes.sql
  supabase/migrations/006_cron.sql
  ```
- [ ] Habilitar extensão `pg_cron` em Database → Extensions
- [ ] Configurar template de e-mail em Authentication → Email Templates:
  - **Magic Link**: mensagem de boas-vindas/acesso
  - **Recovery**: "Defina sua senha para acessar o sistema"
- [ ] Em Authentication → URL Configuration:
  - Site URL: `https://seu-dominio.vercel.app`
  - Redirect URLs: `https://seu-dominio.vercel.app/**`
- [ ] Copiar as chaves em Project Settings → API:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. VAPID Keys (notificações push)

```bash
npx web-push generate-vapid-keys
```

Copiar `publicKey` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  
Copiar `privateKey` → `VAPID_PRIVATE_KEY`  
Definir `VAPID_SUBJECT=mailto:seu@email.com`

---

## 3. Vercel (deploy)

- [ ] Importar repositório em https://vercel.com/new
- [ ] Framework Preset: **Next.js** (detectado automaticamente)
- [ ] Adicionar variáveis de ambiente (Settings → Environment Variables):
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_VAPID_PUBLIC_KEY
  VAPID_PRIVATE_KEY
  VAPID_SUBJECT
  NEXT_PUBLIC_APP_URL
  ```
- [ ] Fazer deploy (clique em Deploy ou `git push origin main`)
- [ ] Verificar URL gerada e atualizar `NEXT_PUBLIC_APP_URL` e o Supabase Site URL

---

## 4. Primeiro acesso

- [ ] No Supabase SQL Editor, criar o primeiro usuário manager:
  ```sql
  -- Após criar o usuário no Authentication manualmente,
  -- atualizar o role para manager:
  UPDATE profiles SET role = 'manager' WHERE email = 'seu@email.com';
  ```
- [ ] Fazer login com e-mail e senha
- [ ] Acessar /admin/settings e configurar:
  - Nome do laboratório
  - Horário do lembrete de entrada
  - Horas diárias esperadas
- [ ] Cadastrar estagiários em /admin/interns/new

---

## 5. Ícones PWA

Adicionar em `public/icons/`:
- `icon-192.png` — 192×192 px
- `icon-512.png` — 512×512 px

Ferramentas recomendadas: https://realfavicongenerator.net

---

## 6. Monitoramento (opcional mas recomendado)

- [ ] Sentry: `npm install @sentry/nextjs` + `npx @sentry/wizard@latest -i nextjs`
- [ ] Vercel Analytics: habilitar em Project Settings → Analytics
- [ ] Configurar alertas de erro no Supabase (Database → Logs)

---

## 7. Verificações pós-deploy

- [ ] Login por e-mail/senha funciona
- [ ] Login por PIN funciona
- [ ] Clock in registra ponto
- [ ] Clock out + atividades funcionam
- [ ] Aprovação/reprovação funcionam
- [ ] PWA pode ser instalado no celular (Add to Home Screen)
- [ ] Notificações push chegam
- [ ] Exportação CSV de relatório funciona
- [ ] Middleware redireciona corretamente por role
