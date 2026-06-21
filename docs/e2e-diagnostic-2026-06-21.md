# Diagnostico de Teste End-to-End - 2026-06-21

Escopo: analise de testabilidade funcional do sistema via jornadas reais de usuario, incluindo abrir paginas, clicar botoes, preencher formularios, navegar entre rotas, acionar APIs e validar respostas visiveis.

Restricao: este diagnostico nao altera UI, UX, motion, animacao, ilustracao ou efeitos.

Premissa de produto: `v2` e considerado o fluxo atual/oficial. Rotas sem prefixo sao tratadas como legado/compatibilidade, exceto telas admin atuais.

## 1. Estado Atual de E2E

Suite E2E inicial configurada apos este diagnostico.

Evidencias:

- `package.json` possui scripts `e2e` e `e2e:prod`.
- `@playwright/test` foi adicionado como dependencia de desenvolvimento.
- `playwright.config.ts` define testes desktop e mobile via Edge/Chromium.
- `tests/e2e/smoke.spec.ts` cobre smoke seguro do fluxo v2 e redirects de rotas protegidas.
- Artefatos locais do Playwright foram ignorados em `.gitignore`.

Conclusao: o sistema agora possui uma primeira camada automatizada de E2E nao destrutiva. Ainda falta ampliar para jornadas autenticadas com usuarios seedados e banco de teste.

## 2. Objetivo do E2E

Validar se o sistema funciona como uma pessoa usuaria real:

- abrir telas principais;
- autenticar;
- navegar entre menus;
- clicar botoes;
- preencher formularios;
- bater ponto;
- registrar saida;
- consultar historico;
- editar perfil;
- gerar relatorios;
- executar acoes admin;
- validar mensagens de erro, sucesso, loading e empty state.

## 3. Ferramenta Adotada

Ferramenta adotada: Playwright.

Motivos:

- combina bem com Next.js;
- testa Chromium, Firefox e WebKit;
- permite interceptar APIs, usar storage state e simular mobile;
- facilita testar camera/permissoes com mocks;
- gera trace, video e screenshot para diagnostico.

Nao recomendo Cypress como primeira opcao neste projeto porque ha muitos fluxos server-side, auth, redirects e mobile/PWA; Playwright tende a ser mais flexivel para esse tipo de app.

Comandos disponiveis:

- `npm run e2e`
- `npm run e2e:prod`

Para apontar para outro ambiente:

- PowerShell: `$env:E2E_BASE_URL="http://localhost:3001"; npm run e2e:prod`
- PowerShell producao: `$env:E2E_BASE_URL="https://controle-de-ponto-estagiarios.vercel.app"; npm run e2e:prod`

## 4. Ambientes de Teste Necessarios

Para E2E confiavel, o projeto precisa separar:

- ambiente local/dev;
- banco Supabase de teste;
- usuarios seedados;
- dados previsiveis;
- storage/avatar de teste;
- flags/mocks para camera/geolocalizacao quando necessario.

Sem isso, os testes podem ficar instaveis porque dependem do banco real, horarios reais, usuarios reais e dados acumulados.

## 5. Personas de Teste

Personas minimas:

- visitante nao logado;
- estagiario ativo;
- estagiario sem foto;
- estagiario com ponto aberto;
- estagiario com historico vazio;
- estagiario com historico preenchido;
- gestor/admin;
- usuario inativo ou sem permissao.

## 6. Jornadas Criticas - Estagiario v2

Prioridade P0:

1. Login v2
   - abrir `/v2/login`;
   - preencher credenciais validas;
   - confirmar redirect para `/v2/dashboard`;
   - validar erro com credenciais invalidas.

2. Dashboard v2
   - abrir `/v2/dashboard`;
   - validar card principal;
   - validar botao de entrada ou saida conforme estado;
   - validar navegacao para historico, ranking e perfil.

3. Bater ponto
   - clicar em `Registrar Entrada`;
   - validar chamada `/api/clock/in`;
   - validar estado com ponto aberto;
   - validar que a tela passa a oferecer saida.

4. Registrar saida
   - clicar no botao de saida;
   - abrir `/v2/checkout?record=...`;
   - adicionar/remover atividade;
   - enviar checkout;
   - validar chamada `/api/clock/out`;
   - confirmar retorno ao dashboard.

5. Historico v2
   - abrir `/v2/history`;
   - navegar mes anterior/proximo;
   - validar empty state;
   - validar registros quando existirem.

6. Perfil v2
   - abrir `/v2/profile`;
   - carregar dados do usuario;
   - editar campos permitidos;
   - salvar;
   - validar persistencia apos reload.

7. Ranking v2
   - abrir `/v2/ranking`;
   - navegar entre meses;
   - validar lista vazia e lista preenchida.

## 7. Jornadas Criticas - Admin

Prioridade P0:

1. Login como gestor
   - autenticar;
   - confirmar redirect para `/admin` ou `/v2/admin`, conforme fluxo usado;
   - validar bloqueio de usuario comum em rotas admin.

2. Painel admin
   - abrir `/admin`;
   - validar lista de estagiarios;
   - abrir detalhes de um estagiario.

3. Cadastro de estagiario
   - abrir `/admin/interns/new`;
   - preencher formulario minimo;
   - enviar;
   - validar criacao via `/api/admin/create-intern`;
   - validar retorno para `/admin/interns`.

4. Edicao de estagiario
   - abrir `/admin/interns/[id]`;
   - editar dados;
   - salvar;
   - validar persistencia.

5. Horarios/carga
   - abrir detalhes do estagiario;
   - alterar agenda;
   - salvar;
   - validar refletir em carga/relatorios.

6. Relatorios admin
   - abrir `/admin/reports`;
   - escolher relatorio, periodo e estagiario quando necessario;
   - gerar PDF/Excel;
   - validar download ou resposta;
   - validar que `/api/admin/report-data` e RPC `get_report_summary` respondem.

7. Atualizacoes e feedback
   - criar update;
   - ver update na area do usuario;
   - enviar feedback como usuario;
   - responder/alterar status como admin.

8. Configuracoes
   - abrir `/admin/settings`;
   - validar formularios de settings;
   - validar botoes operacionais sensiveis com permissao admin.

## 8. Fluxos Legados que Ainda Precisam de Cobertura

Como `v2` e o fluxo atual, os legados devem ser testados em smoke/regressao:

- `/login`;
- `/register`;
- `/dashboard`;
- `/checkout`;
- `/history`;
- `/profile`;
- `/intern-ranking`;
- `/updates`.

Objetivo: garantir que nao quebram enquanto existirem ou ate serem formalmente aposentados.

## 9. Pontos de Alto Risco para E2E

1. Auth e redirects
   - ha rotas com redirects server-side e client-side;
   - precisa validar usuario comum vs admin.

2. Estado temporal
   - ponto depende de horario atual, registro aberto e mes selecionado;
   - testes precisam congelar horario ou controlar dados.

3. Camera/selfie
   - `SelfieGate` depende de permissao de camera e storage;
   - E2E deve usar mock de permissao/camera ou caminho de upload.

4. Banco e RLS
   - fluxos admin e usuario dependem de permissoes;
   - testes precisam provar que usuario nao acessa dados admin.

5. Relatorios
   - dependem de dados agregados, RPC e exports;
   - precisam validar tanto resposta quanto conteudo minimo.

6. Geolocalizacao/PWA/push
   - devem ter testes isolados ou mocks, para nao travar a suite principal.

## 10. Lacunas de Testabilidade

- Sem framework E2E instalado.
- Sem script padrao `npm run e2e`.
- Sem seeds oficiais para usuarios e registros.
- Sem ambiente Supabase dedicado para teste.
- Sem helpers para login persistido.
- Sem mocks oficiais para camera, geolocalizacao, storage e push.
- Sem seletores estaveis `data-testid` nos principais botoes e inputs.
- Sem matriz formal de rotas atuais vs legado.

## 11. Seletores Recomendados

Adicionar gradualmente `data-testid`, sem alterar aparencia:

- `login-email-input`;
- `login-password-input`;
- `login-submit-button`;
- `clock-in-button`;
- `clock-out-button`;
- `checkout-submit-button`;
- `activity-input`;
- `history-month-prev`;
- `history-month-next`;
- `profile-save-button`;
- `admin-create-intern-button`;
- `admin-report-generate-button`;
- `admin-export-pdf-button`;
- `admin-export-excel-button`.

## 12. Smoke Test Manual Imediato

Sem instalar nada, o QA manual minimo deveria seguir esta ordem:

1. Acessar `/v2/login`.
2. Login como estagiario.
3. Abrir `/v2/dashboard`.
4. Registrar entrada.
5. Ir para checkout.
6. Registrar saida com atividade.
7. Abrir historico.
8. Abrir perfil.
9. Abrir ranking.
10. Sair.
11. Login como admin.
12. Abrir painel admin.
13. Abrir cadastro de estagiario.
14. Gerar relatorio.
15. Abrir settings.

## 13. Roadmap de Automacao E2E

Fase 1 - Base:

- instalar Playwright;
- criar `playwright.config.ts`;
- criar `npm run e2e`;
- criar usuarios de teste;
- criar `storageState` para admin e estagiario;
- testar login e redirects.

Fase 2 - Core:

- E2E de bater ponto;
- E2E de checkout;
- E2E de historico;
- E2E de perfil;
- E2E de relatorios.

Fase 3 - Admin:

- cadastro/edicao de estagiario;
- agenda/carga horaria;
- relatorios exportaveis;
- updates e feedback;
- settings sensiveis.

Fase 4 - Resiliencia:

- mobile viewport;
- camera mock;
- geolocalizacao mock;
- erro de rede;
- usuario sem permissao;
- dados vazios.

## 14. Criterio de Pronto

O E2E deve ser considerado minimo quando:

- login estagiario e admin passam;
- bater ponto e sair passam;
- historico reflete o registro;
- admin consegue gerar relatorio;
- usuario comum nao acessa admin;
- suite roda com um unico comando;
- falhas geram screenshot/trace.

## 15. Health Check E2E

Status atual: vermelho/amarelo.

- Cobertura automatizada: vermelho.
- Mapeamento de fluxos: amarelo/verde.
- Testabilidade do produto: amarelo.
- Build/lint como pre-condicao: verde.
- Dados de teste: vermelho.
- Prontidao para Playwright: verde.

## 16. Proxima Acao Recomendada

Criar a fundacao Playwright sem mexer na interface:

- adicionar dependencia de desenvolvimento;
- criar config;
- criar testes smoke para `/v2/login`, `/v2/dashboard`, `/v2/history`, `/v2/profile` e `/admin`;
- usar usuarios de teste em `.env.test.local`;
- manter testes destrutivos isolados em banco de teste.
