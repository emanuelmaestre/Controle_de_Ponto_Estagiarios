# Analise completa do projeto - 2026-06-21

Escopo: diagnostico tecnico, code review, arquitetura, seguranca, performance, UX/UI, produto, requisitos, divida tecnica, qualidade, banco, deploy/infra, observabilidade, risco, refatoracao, roadmap, gap analysis, threat modeling e health check.

Restricao respeitada: esta analise nao altera UI, UX, motion, ilustracao ou animacao.

## 1. Diagnostico tecnico

Estado atual: o projeto compila e faz build em producao. `npx tsc --noEmit` passou e `npm run build` passou. `npm run lint` falha com 65 erros e 63 avisos, principalmente em componentes React/React Compiler, uso de `any` e regras de pureza.

Prioridade imediata: estabilizar backend, banco, tipagem e observabilidade para sustentar as funcionalidades ja existentes com mais previsibilidade.

## 2. Code review

Principais achados:

- `src/types/database.ts` foi atualizado para cobrir `feedback`, `system_updates`, `get_report_summary` e campos usados por relatorios.
- Algumas APIs ainda usam `service role` em fluxos de usuario autenticado, como relatorios do estagiario, ranking, perfil e feedback.
- Lint aponta erros reais de React Compiler em componentes, mas estes foram deixados intocados por restricao de UI.

## 3. Analise de arquitetura

Existe uma tentativa de Clean Architecture em `src/domain`, `src/application` e `src/infra`, mas grande parte do produto real ainda vive diretamente em `src/app` e nas API routes.

Problema principal: as API routes acumulam autenticacao, validacao, regra de negocio, query SQL e formatacao de resposta. Isso aumenta acoplamento e dificulta testes.

Direcao recomendada: migrar primeiro os fluxos P0 para use cases pequenos: ponto, relatorio mensal, cadastro de estagiario, perfil e settings.

## 4. Analise de seguranca

Melhorias recentes: rotas sensiveis foram protegidas por `requireManager`, endpoints legados passaram a retornar `410 Gone`, `register-with-photo` foi endurecida e `debug/whoami` foi descontinuada.

Riscos restantes:

- `PUBLIC_PATHS` libera todo prefixo `/api/auth`, incluindo endpoints que usam service role. As rotas validam internamente, mas a superficie publica continua grande.
- RLS existe, mas muitas rotas usam service role para contornar RLS.
- Storage de avatars tem politicas comentadas na migration; se nao estiverem aplicadas manualmente, ha risco operacional.
- `verify-pin` ainda usa magic link e service role, exigindo atencao especial de validacao e rate limit.

## 5. Analise de performance

Pontos positivos: build passa, indices basicos existem para `time_records`, e `admin/report-data` foi otimizado para RPC SQL.

Gargalos:

- `admin/reports-catalog` ainda faz varias consultas e agregacoes em JS por tipo de relatorio.
- `admin/notifications` faz multiplas consultas e loops em memoria para todos os estagiarios.
- Ranking/gamificacao calcula agregados por periodo em runtime.
- Bundle carrega bibliotecas pesadas como `framer-motion`, `recharts`, `xlsx`, `jspdf`, `number-flow`, `swr` e `react-query`.

## 6. Analise de UX/UI

Diagnostico apenas, sem alteracao visual.

As principais superficies do produto precisam manter consistencia entre fluxo atual, v2, dashboard, perfil, admin, settings e relatorios.

Ponto de atencao: manter clareza de navegacao e continuidade entre fluxos equivalentes, principalmente quando ha telas antigas e telas v2 coexistindo.

## 7. Analise de produto

O produto ja cobre os fluxos centrais de autenticacao, ponto, perfil, administracao, relatorios e acompanhamento.

Valor principal: manter confiabilidade operacional, previsibilidade dos relatorios e seguranca das permissoes.

## 8. Analise de requisitos

Implementado: login, registro, ponto, historico, perfil, admin, relatorios, settings, ranking, atualizacoes, feedback e fluxos auxiliares.

Ponto de atencao: documentar criterios de aceite por funcionalidade para reduzir ambiguidade entre comportamento esperado e implementacao atual.

## 9. Analise de divida tecnica

Dividas principais:

- Tipos do Supabase precisam continuar sendo regenerados apos novas migrations.
- Rotas de estagiario foram tipadas, mas ainda devem receber testes de contrato.
- Duplicidade de clientes Supabase em `src/lib/supabase` e `src/infra/supabase`.
- Coexistencia de app atual e `/v2`.
- Lint falhando com erros de React Compiler.
- Comentarios/textos com encoding corrompido em arquivos antigos.

## 10. Analise de qualidade de codigo

O TypeScript compila, mas a qualidade ainda e irregular. Ha alguns `as any`, regras de lint falhando e responsabilidades misturadas.

Ponto bom: foram criados helpers reutilizaveis (`route-auth`, `logger`, `deprecated-route`) que ja reduzem repeticao.

## 11. Analise de banco de dados

Schema cobre ponto, perfil, configuracoes, notificacoes, ranking/gamificacao, feedback, updates e dados auxiliares.

RLS cobre tabelas antigas principais, mas migrations recentes precisam ser revisadas para garantir RLS em `feedback` e `system_updates`.

A migration `023_report_summary_rpc.sql` adiciona `get_report_summary`; ela precisa estar aplicada no Supabase de producao.

## 12. Analise de deploy/infra

Vercel esta ativo e deploy de producao ficou `Ready`. URL principal respondeu 200. Logs de erro na ultima hora estavam limpos na verificacao feita apos deploy.

Risco: migration SQL nao e aplicada automaticamente pelo deploy Vercel. O banco precisa de `npx supabase db push` ou pipeline separado de migrations.

## 13. Analise de observabilidade

Foi criada camada simples de logs estruturados, mas cobertura ainda e parcial.

Gaps:

- Sem correlation/request id.
- Sem metricas de negocio: pontos batidos, erros por endpoint, latencia por relatorio.
- Sem alertas configurados.
- Logs ainda misturam `console.error` solto e logger estruturado.

## 14. Analise de risco

P0:

- Migration `023` nao aplicada em producao pode quebrar relatorio otimizado.
- Service role ainda aparece em alguns fluxos autenticados e deve ser reduzido gradualmente.
- Lint falhando com erros reais em componentes, embora build passe.

P1:

- Tipos Supabase defasados reduzem confianca.
- Tipos Supabase defasados reduzem confianca.
- Relatorios complexos ainda em JS podem degradar com mais dados.

## 15. Plano de refatoracao

1. Aplicar migration `023` no Supabase.
2. Regenerar `src/types/database.ts` pelo Supabase CLI apos aplicar as migrations.
3. Reduzir service role em rotas autenticadas, usando RLS quando possivel.
4. Migrar relatorios restantes para SQL/RPC.
5. Centralizar logging em todas as API routes criticas.
6. Em rodada autorizada de UI, revisar consistencia entre telas atuais e v2.

## 16. Roadmap tecnico

Fase 1 - Estabilizacao: migrations, tipos, rotas sensiveis, logs, lint backend.

Fase 2 - Banco e performance: RPCs de relatorio, indices compostos, RLS das tabelas recentes.

Fase 3 - Simplificacao: escolher app atual ou v2, remover duplicidades e dependencias nao essenciais.

Fase 4 - Qualidade: testes de API, contrato de relatorios, CI com typecheck/build/lint.

## 17. Gap analysis

Estado desejado: sistema seguro, tipado, com banco como fonte de agregacao e deploy previsivel.

Estado atual: app funcional e deployado, mas ainda com features expandidas, tipos incompletos, service role em excesso e lint falhando.

Gap principal: consolidacao tecnica, tipagem e automacao de qualidade.

## 18. Threat modeling

Ativos: dados pessoais de estagiarios, registros de ponto, fotos, relatorios, roles, PINs e tokens de sessao.

Ameacas:

- Usuario autenticado tentando acessar dados de outro usuario.
- Intern tentando acionar rota admin ou alterar profile alheio.
- Endpoint publico usando service role sendo abusado.
- Vazamento por logs ou debug endpoint.
- Relatorio expondo dados agregados sem autorizacao.

Mitigacoes atuais: RLS, `requireManager`, `canManageTargetUser`, endpoints legados 410, headers de seguranca no Vercel.

Mitigacoes faltantes: rate limit, auditoria de RLS recente, request id, validacao consistente e reducao de service role.

## 19. Health check

Saude geral: amarela.

Build: verde.
Typecheck: verde.
Lint: vermelho.
Seguranca: amarela melhorando.
Banco: amarelo por migration/tipos/RLS recentes.
Produto: amarelo por coexistencia de fluxos atuais e v2.
Observabilidade: amarela inicial.
Deploy: verde, com ressalva de migrations manuais.
