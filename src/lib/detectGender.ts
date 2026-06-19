// Detecta gênero automaticamente pelo primeiro nome (nomes brasileiros)
// Retorna 'F' | 'M' | null (quando não é possível determinar)

const FEMININE = new Set([
  // A
  'adriana','agatha','agnes','alessandra','alessia','alice','aline','alícia',
  'amanda','amelia','amélia','ana','anabela','anabel','andrea','andreia','angela',
  'ângela','anika','anita','antonella','ariana','arielle','ashley','aurora',
  // B
  'bárbara','barbara','beatriz','bianca','brenda','bruna',
  // C
  'camila','carina','carla','carlota','carolina','caroline','cassandra','cecília',
  'cecilia','celia','célia','christiane','christiana','claire','clarissa','claudia',
  'cláudia','cristiane','cristina',
  // D
  'daniela','danielle','débora','debora','denise','diana','dulce',
  // E
  'eduarda','elaine','elisa','elaine','eliana','elisa','elizabeth','ellen',
  'emanuele','emanuelle','emilia','emília','erica','érica','estefani','estefany',
  'estela','ester','evelyn',
  // F
  'fabiana','fábia','fabia','fernanda','flávia','flavia','franciele','francisca',
  'francine','francesca',
  // G
  'gabriela','gabrielle','giovana','giovanna','gisele','giselle','graciela',
  'graziela','giulia','giuliana',
  // H
  'heloisa','heloísa','helena',
  // I
  'ingrid','irene','isabela','isabella','isadora','isis',
  // J
  'jackeline','jacqueline','jade','janaína','janaina','jaqueline','jéssica',
  'jessica','joana','josefa','juliana','julianna','júlia','julia','júlia',
  // K
  'karina','karla','karoline','kelly','ketlyn','ketyllen',
  // L
  'lara','larissa','laura','layane','layla','laysa','leilane','leticia','letícia',
  'lia','liana','lídia','lidia','lívia','livia','lorena','lorraine','luana',
  'luciana','luiza','luíza',
  // M
  'maiara','maíra','maira','manoela','manuela','marcela','marcia','márcia',
  'margarida','maria','mariana','mariela','marina','marisa','maristela',
  'mayara','melissa','micheli','michelly','mirela','mirella','miriam','mônica',
  'monica','morgana',
  // N
  'naiara','natalia','natália','nathalia','nathália','nathalie','nicoly','nicole',
  'nina',
  // P
  'pamela','pâmela','patricia','patrícia','paula','pauline','priscila','priscilla',
  // R
  'rafaela','rafaella','raissa','raíssa','raquel','rebeca','rebeka','regina',
  'renata','roberta','rosana','rosane','rosangela','rosângela','ruth',
  // S
  'sabrina','samantha','sandra','sara','sarah','sasha','silvia','sílvia',
  'simone','sofia','sophia','stefani','stefany','stephanie',
  // T
  'tamara','tamires','taniara','tatiana','tatiane','thais','thaís','thayná',
  'thaynara','tiffany','tuany',
  // V
  'valentina','vanessa','veronica','verônica','victória','vitoria','vitória',
  'viviane','vivian',
  // Y
  'yasmin','yasmim','yara',
])

const MASCULINE = new Set([
  // A
  'adão','adao','adriano','alan','alef','alex','alexandre','alexsandro','alisson',
  'anderson','andre','andré','antonio','antônio','ariel','arthur','augusto',
  // B
  'bernardo','breno','brian','bruno',
  // C
  'caio','carlos','cauã','caua','cesar','césar','christian','christiano',
  'cláudio','claudio','cleyton','clayton',
  // D
  'daniel','danilo','davi','david','diego','diogo','douglas','dyego',
  // E
  'edson','eduardo','elias','emanuel','emmanuel','enzo','eric','éric','erik',
  // F
  'fabiano','fabio','fábio','felipe','fernado','fernando',
  // G
  'gabriel','geovani','giovani','gustavo','guilherme',
  // H
  'henrique','hugo',
  // I
  'igor','iago',
  // J
  'jean','jefferson','jonatan','jonathan','joão','joao','jorge','jose','josé',
  'josué','josue','julio','júlio','junior','júnior',
  // K
  'kaique','kevin','kleber','kléber',
  // L
  'leandro','leonardo','luan','lucas','luiz','luís',
  // M
  'marcelo','marcio','márcio','marcos','mateus','matheus','mauricio','maurício',
  'michael','miguel','murilo',
  // N
  'nicolas','nikolas',
  // O
  'otavio','otávio',
  // P
  'pablo','patrick','paulo','pedro',
  // R
  'rafael','raul','renato','ricardo','roberto','rodrigo','roger','rogério',
  'rogerio','romulo','rômulo','ryan',
  // S
  'samuel','sergio','sérgio',
  // T
  'thiago','tiago','tomas','tomás','tony',
  // V
  'victor','víctor','vinicius','vinícius','vitor',
  // W
  'wagner','walter','wellington','william','willian',
  // Y
  'yan','yuri',
])

// Terminações que indicam gênero quando o nome não está no dicionário
const FEMININE_ENDINGS = ['ela','ela','ina','ana','ona','ane','ene','elle','elly','elly','issa','essa','ica','inha','nia','cia','sia','zia','lla']
const MASCULINE_ENDINGS = ['son','ton','ino','aldo','ardo','erto','ilio','eiro','ino','ão','ao','or','el','uel','nel']

export type Gender = 'F' | 'M' | null

export function detectGender(fullName: string): Gender {
  if (!fullName?.trim()) return null

  const firstName = fullName.trim().split(/\s+/)[0].toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos para comparação

  const firstNameAccented = fullName.trim().split(/\s+/)[0].toLowerCase()

  // Verificar no dicionário (com e sem acento)
  if (FEMININE.has(firstNameAccented) || FEMININE.has(firstName)) return 'F'
  if (MASCULINE.has(firstNameAccented) || MASCULINE.has(firstName)) return 'M'

  // Fallback por terminação
  for (const ending of FEMININE_ENDINGS) {
    if (firstName.endsWith(ending)) return 'F'
  }
  for (const ending of MASCULINE_ENDINGS) {
    if (firstName.endsWith(ending)) return 'M'
  }

  // Regra geral: nomes terminados em -a costumam ser femininos no português
  if (firstName.endsWith('a') && !firstName.endsWith('luca')) return 'F'
  // Nomes terminados em -o costumam ser masculinos
  if (firstName.endsWith('o')) return 'M'

  return null
}
