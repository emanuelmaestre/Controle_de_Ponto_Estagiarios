# Revisao funcional do backend

Data: 20/06/2026

## Decisao de escopo

O produto segue como MVP simples de controle de ponto. Funcionalidades fora desse foco devem ser mantidas apenas quando ja sustentam fluxo ativo de tela ou quando houver decisao futura documentada.

## Mantidas porque estao em uso

- Autenticacao: login, logout, cadastro, esqueci senha, definir senha, PIN enquanto existir tela chamando o fluxo.
- Ponto: entrada, saida, historico e registros.
- Perfil: leitura, edicao, foto e alteracao de senha.
- Admin: cadastro de estagiario, reset de senha, listagem de estagiarios, relatorios, envio de relatorio, notificacoes administrativas.
- Atualizacoes e feedback: usadas por `/updates`, `/profile` e `/admin/updates`.
- Ranking/gamificacao agregada: usada por `/intern-ranking`, `/admin/ranking` e telas v2.
- Settings operacionais: health check, sync profiles, normalize names, fix start dates e backfill de gamificacao enquanto houver botoes ativos.

## Descontinuadas no backend

Estas rotas agora retornam `410 Gone` por nao terem referencia ativa ou por ficarem fora do escopo MVP:

- `POST /api/admin/fix-roles`
- `POST /api/admin/fix-test-profile`
- `POST /api/admin/normalize-courses`
- `POST /api/auth/repair-profile`
- `GET /api/debug/whoami`
- `GET /api/gamification/me`
- `POST /api/push/subscribe`

## Pendencias recomendadas

- Remover chamadas/telas de manutencao somente em uma rodada autorizada de UI.
- Remover `@ts-nocheck` de `src/app/api/intern/reports/route.ts` e `src/app/api/intern/feedback/route.ts`.
- Atualizar `src/types/database.ts` para incluir tabelas `feedback` e `system_updates`, eliminando casts `as any` localizados.
- Depois de aplicar a migration `023_report_summary_rpc.sql`, validar o relatorio mensal contra dados reais.
