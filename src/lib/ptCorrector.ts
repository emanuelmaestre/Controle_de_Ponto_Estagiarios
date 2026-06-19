// Corretor automático de português — palavras comuns sem acento → com acento correto
// Trabalha em MAIÚSCULAS (o sistema sempre armazena em caixa alta)

const CORRECTIONS: Record<string, string> = {
  // -ÇÃO / -ÇÕ
  'ACAO':             'AÇÃO',
  'ACOES':            'AÇÕES',
  'ADMINISTRACAO':    'ADMINISTRAÇÃO',
  'APLICACAO':        'APLICAÇÃO',
  'ATUALIZACAO':      'ATUALIZAÇÃO',
  'AUTORIZACAO':      'AUTORIZAÇÃO',
  'AVALIACAO':        'AVALIAÇÃO',
  'CERTIFICACAO':     'CERTIFICAÇÃO',
  'COMUNICACAO':      'COMUNICAÇÃO',
  'CONFIGURACAO':     'CONFIGURAÇÃO',
  'CONSTRUCAO':       'CONSTRUÇÃO',
  'CONTRATACAO':      'CONTRATAÇÃO',
  'CORRECAO':         'CORREÇÃO',
  'CRIACAO':          'CRIAÇÃO',
  'DIGITACAO':        'DIGITAÇÃO',
  'DOCUMENTACAO':     'DOCUMENTAÇÃO',
  'EDUCACAO':         'EDUCAÇÃO',
  'ELABORACAO':       'ELABORAÇÃO',
  'ESPECIFICACAO':    'ESPECIFICAÇÃO',
  'EXECUCAO':         'EXECUÇÃO',
  'EXIBICAO':         'EXIBIÇÃO',
  'EXPLICACAO':       'EXPLICAÇÃO',
  'FUNCAO':           'FUNÇÃO',
  'FUNCOES':          'FUNÇÕES',
  'GESTAO':           'GESTÃO',
  'IMPLANTACAO':      'IMPLANTAÇÃO',
  'IMPLEMENTACAO':    'IMPLEMENTAÇÃO',
  'INFORMACAO':       'INFORMAÇÃO',
  'INSTALACAO':       'INSTALAÇÃO',
  'INTEGRACAO':       'INTEGRAÇÃO',
  'INTRODUCAO':       'INTRODUÇÃO',
  'LOCACAO':          'LOCAÇÃO',
  'MANUTENCAO':       'MANUTENÇÃO',
  'MIGRACAO':         'MIGRAÇÃO',
  'NOTIFICACAO':      'NOTIFICAÇÃO',
  'OPERACAO':         'OPERAÇÃO',
  'OPERACOES':        'OPERAÇÕES',
  'ORGANIZACAO':      'ORGANIZAÇÃO',
  'ORIENTACAO':       'ORIENTAÇÃO',
  'PARTICIPACAO':     'PARTICIPAÇÃO',
  'PREPARACAO':       'PREPARAÇÃO',
  'PRODUCAO':         'PRODUÇÃO',
  'PROGRAMACAO':      'PROGRAMAÇÃO',
  'PUBLICACAO':       'PUBLICAÇÃO',
  'REALIZACAO':       'REALIZAÇÃO',
  'REVISAO':          'REVISÃO',
  'SELECAO':          'SELEÇÃO',
  'SEPARACAO':        'SEPARAÇÃO',
  'SOLUCAO':          'SOLUÇÃO',
  'SUBSTITUICAO':     'SUBSTITUIÇÃO',
  'TRADUCAO':         'TRADUÇÃO',
  'VERIFICACAO':      'VERIFICAÇÃO',
  'VISUALIZACAO':     'VISUALIZAÇÃO',

  // -ÃO simples
  'REUNIAO':          'REUNIÃO',
  'REUNIOES':         'REUNIÕES',
  'MANUSEIO':         'MANUSEIO',
  'MANUTENCOES':      'MANUTENÇÕES',

  // Acento agudo / circunflexo
  'ANALISE':          'ANÁLISE',
  'AREA':             'ÁREA',
  'AREAS':            'ÁREAS',
  'ARQUIVO':          'ARQUIVO',
  'ATIVIDADE':        'ATIVIDADE',
  'ELETRICA':         'ELÉTRICA',
  'ELETRICO':         'ELÉTRICO',
  'EQUIPAMENTO':      'EQUIPAMENTO',
  'ESPECIFICO':       'ESPECÍFICO',
  'ESPECIFICA':       'ESPECÍFICA',
  'GRAFICO':          'GRÁFICO',
  'HISTORICO':        'HISTÓRICO',
  'LABORATORIO':      'LABORATÓRIO',
  'MATEMATICA':       'MATEMÁTICA',
  'MEDICO':           'MÉDICO',
  'MEDICA':           'MÉDICA',
  'MECANICO':         'MECÂNICO',
  'MODULO':           'MÓDULO',
  'NUMERO':           'NÚMERO',
  'NUMEROS':          'NÚMEROS',
  'PEDAGOGICO':       'PEDAGÓGICO',
  'POLEMICA':         'POLÊMICA',
  'PRATICA':          'PRÁTICA',
  'PRATICO':          'PRÁTICO',
  'PUBLICO':          'PÚBLICO',
  'PUBLICA':          'PÚBLICA',
  'RELATORIO':        'RELATÓRIO',
  'RELATORIOS':       'RELATÓRIOS',
  'SISTEMA':          'SISTEMA',
  'TECNICA':          'TÉCNICA',
  'TECNICO':          'TÉCNICO',
  'TECNICOS':         'TÉCNICOS',
  'TOPICO':           'TÓPICO',
  'TOPICOS':          'TÓPICOS',
  'UNICO':            'ÚNICO',
  'UNICA':            'ÚNICA',

  // Palavras comuns sem trema / cedilha
  'ORCAMENTO':        'ORÇAMENTO',
  'CRIANCA':          'CRIANÇA',
  'FRANCA':           'FRANÇA',

  // Erros ortográficos comuns
  'SUBISTITUI':       'SUBSTITUI',
  'SUBSTITUIU':       'SUBSTITUIU',
  'PREENCHIMENTO':    'PREENCHIMENTO',
  'LANCAMENTO':       'LANÇAMENTO',
  'DESCRICAO':        'DESCRIÇÃO',
}

/**
 * Corrige automaticamente palavras sem acento em texto em maiúsculas.
 * Preserva pontuação e palavras já corretas.
 */
export function correctPortuguese(text: string): string {
  // Trabalha palavra por palavra preservando espaços e pontuação
  return text.replace(/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]+/g, (word) => {
    return CORRECTIONS[word] ?? word
  })
}
