-- ============================================================
-- 017 · Padroniza todas as atividades existentes em MAIÚSCULAS
-- e aplica correções de acentuação mais comuns do português
-- ============================================================

-- 1. Converter tudo para maiúsculas primeiro
UPDATE activities
SET description = UPPER(description)
WHERE description <> UPPER(description);

-- 2. Correções de acentuação palavra por palavra
-- (substitui somente a palavra inteira, case-insensitive, preservando o restante)
DO $$
DECLARE
  corrections TEXT[][] := ARRAY[
    ARRAY['ACAO',          'AÇÃO'],
    ARRAY['ACOES',         'AÇÕES'],
    ARRAY['ADMINISTRACAO', 'ADMINISTRAÇÃO'],
    ARRAY['APLICACAO',     'APLICAÇÃO'],
    ARRAY['ATUALIZACAO',   'ATUALIZAÇÃO'],
    ARRAY['AUTORIZACAO',   'AUTORIZAÇÃO'],
    ARRAY['AVALIACAO',     'AVALIAÇÃO'],
    ARRAY['CERTIFICACAO',  'CERTIFICAÇÃO'],
    ARRAY['COMUNICACAO',   'COMUNICAÇÃO'],
    ARRAY['CONFIGURACAO',  'CONFIGURAÇÃO'],
    ARRAY['CONSTRUCAO',    'CONSTRUÇÃO'],
    ARRAY['CORRECAO',      'CORREÇÃO'],
    ARRAY['CRIACAO',       'CRIAÇÃO'],
    ARRAY['DIGITACAO',     'DIGITAÇÃO'],
    ARRAY['DOCUMENTACAO',  'DOCUMENTAÇÃO'],
    ARRAY['EDUCACAO',      'EDUCAÇÃO'],
    ARRAY['ELABORACAO',    'ELABORAÇÃO'],
    ARRAY['ESPECIFICACAO', 'ESPECIFICAÇÃO'],
    ARRAY['EXECUCAO',      'EXECUÇÃO'],
    ARRAY['EXIBICAO',      'EXIBIÇÃO'],
    ARRAY['EXPLICACAO',    'EXPLICAÇÃO'],
    ARRAY['FUNCAO',        'FUNÇÃO'],
    ARRAY['FUNCOES',       'FUNÇÕES'],
    ARRAY['GESTAO',        'GESTÃO'],
    ARRAY['IMPLANTACAO',   'IMPLANTAÇÃO'],
    ARRAY['IMPLEMENTACAO', 'IMPLEMENTAÇÃO'],
    ARRAY['INFORMACAO',    'INFORMAÇÃO'],
    ARRAY['INSTALACAO',    'INSTALAÇÃO'],
    ARRAY['INTEGRACAO',    'INTEGRAÇÃO'],
    ARRAY['INTRODUCAO',    'INTRODUÇÃO'],
    ARRAY['MANUTENCAO',    'MANUTENÇÃO'],
    ARRAY['MIGRACAO',      'MIGRAÇÃO'],
    ARRAY['NOTIFICACAO',   'NOTIFICAÇÃO'],
    ARRAY['OPERACAO',      'OPERAÇÃO'],
    ARRAY['OPERACOES',     'OPERAÇÕES'],
    ARRAY['ORGANIZACAO',   'ORGANIZAÇÃO'],
    ARRAY['ORIENTACAO',    'ORIENTAÇÃO'],
    ARRAY['PARTICIPACAO',  'PARTICIPAÇÃO'],
    ARRAY['PREPARACAO',    'PREPARAÇÃO'],
    ARRAY['PRODUCAO',      'PRODUÇÃO'],
    ARRAY['PROGRAMACAO',   'PROGRAMAÇÃO'],
    ARRAY['PUBLICACAO',    'PUBLICAÇÃO'],
    ARRAY['REALIZACAO',    'REALIZAÇÃO'],
    ARRAY['REUNIAO',       'REUNIÃO'],
    ARRAY['REVISAO',       'REVISÃO'],
    ARRAY['SELECAO',       'SELEÇÃO'],
    ARRAY['SEPARACAO',     'SEPARAÇÃO'],
    ARRAY['SOLUCAO',       'SOLUÇÃO'],
    ARRAY['SUBSTITUICAO',  'SUBSTITUIÇÃO'],
    ARRAY['TRADUCAO',      'TRADUÇÃO'],
    ARRAY['VERIFICACAO',   'VERIFICAÇÃO'],
    ARRAY['VISUALIZACAO',  'VISUALIZAÇÃO'],
    ARRAY['DESCRICAO',     'DESCRIÇÃO'],
    ARRAY['LANCAMENTO',    'LANÇAMENTO'],
    ARRAY['ORCAMENTO',     'ORÇAMENTO'],
    ARRAY['ANALISE',       'ANÁLISE'],
    ARRAY['AREA',          'ÁREA'],
    ARRAY['AREAS',         'ÁREAS'],
    ARRAY['ELETRICA',      'ELÉTRICA'],
    ARRAY['ELETRICO',      'ELÉTRICO'],
    ARRAY['ESPECIFICO',    'ESPECÍFICO'],
    ARRAY['ESPECIFICA',    'ESPECÍFICA'],
    ARRAY['GRAFICO',       'GRÁFICO'],
    ARRAY['HISTORICO',     'HISTÓRICO'],
    ARRAY['LABORATORIO',   'LABORATÓRIO'],
    ARRAY['MEDICO',        'MÉDICO'],
    ARRAY['MEDICA',        'MÉDICA'],
    ARRAY['MODULO',        'MÓDULO'],
    ARRAY['NUMERO',        'NÚMERO'],
    ARRAY['NUMEROS',       'NÚMEROS'],
    ARRAY['PRATICA',       'PRÁTICA'],
    ARRAY['PRATICO',       'PRÁTICO'],
    ARRAY['PUBLICO',       'PÚBLICO'],
    ARRAY['PUBLICA',       'PÚBLICA'],
    ARRAY['RELATORIO',     'RELATÓRIO'],
    ARRAY['RELATORIOS',    'RELATÓRIOS'],
    ARRAY['TECNICA',       'TÉCNICA'],
    ARRAY['TECNICO',       'TÉCNICO'],
    ARRAY['TECNICOS',      'TÉCNICOS'],
    ARRAY['TOPICO',        'TÓPICO'],
    ARRAY['TOPICOS',       'TÓPICOS'],
    ARRAY['UNICO',         'ÚNICO'],
    ARRAY['UNICA',         'ÚNICA']
  ];
  pair TEXT[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY corrections LOOP
    UPDATE activities
    SET description = regexp_replace(
      description,
      '(^|[\s,;.!?])'  || pair[1] || '([\s,;.!?]|$)',
      '\1'              || pair[2] || '\2',
      'g'
    )
    WHERE description ~ ('(^|[\s,;.!?])' || pair[1] || '([\s,;.!?]|$)');
  END LOOP;
END $$;

-- Confirma
SELECT COUNT(*) AS total_atividades FROM activities;
