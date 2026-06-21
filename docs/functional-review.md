# Revisao funcional do backend

Data: 20/06/2026

## Decisao de continuidade

As funcionalidades existentes devem ser mantidas quando sustentam fluxo ativo de tela ou operacao real do sistema.

## Mantidas porque estao em uso

- Autenticacao: login, logout, cadastro, esqueci senha, definir senha e PIN.
- Ponto: entrada, saida, historico e registros.
- Perfil: leitura, edicao, foto e alteracao de senha.
- Admin: cadastro de estagiario, reset de senha, listagem de estagiarios, relatorios, envio de relatorio, notificacoes administrativas.
- Atualizacoes e feedback: usadas por `/updates`, `/profile` e `/admin/updates`.
- Ranking/gamificacao agregada: usada por `/intern-ranking`, `/admin/ranking` e telas v2.
- Settings operacionais: health check, sync profiles, normalize names, fix start dates e backfill de gamificacao enquanto houver botoes ativos.

## Descontinuadas no backend

Estas rotas agora retornam `410 Gone` por nao terem referencia ativa ou por serem rotas pontuais de manutencao/debug:

- `POST /api/admin/fix-roles`
- `POST /api/admin/fix-test-profile`
- `POST /api/admin/normalize-courses`
- `POST /api/auth/repair-profile`
- `GET /api/debug/whoami`
- `GET /api/gamification/me`
- `POST /api/push/subscribe`

## Pendencias recomendadas

- Remover chamadas/telas de manutencao somente em uma rodada autorizada de UI.
- Manter `src/types/database.ts` sincronizado com novas migrations via Supabase CLI.
- Adicionar testes de contrato para `src/app/api/intern/reports/route.ts` e `src/app/api/intern/feedback/route.ts`.
- Depois de aplicar a migration `023_report_summary_rpc.sql`, validar o relatorio mensal contra dados reais.
