// Detecta gênero automaticamente pelo primeiro nome
// Cobre nomes brasileiros + internacionais (estudantes estrangeiros no Brasil)
// Retorna 'F' | 'M' | null (quando não é possível determinar)

const FEMININE = new Set([
  // ── Brasileiros / Portugueses ────────────────────────────────
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
  'eduarda','elaine','elisa','eliana','elizabeth','ellen',
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
  'ingrid','irene','isabela','isabella','isadora','isis','isabel','isabelle',
  // J
  'jackeline','jacqueline','jade','janaína','janaina','jaqueline','jéssica',
  'jessica','joana','josefa','juliana','julianna','júlia','julia',
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
  'renata','roberta','rosana','rosane','rosangela','rosângela','ruth','rachel',
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

  // ── Espanhol / Hispânico ─────────────────────────────────────
  'jimena','belen','belén','luz','carmen','consuelo','dolores','esperanza',
  'mercedes','pilar','rosario','sol','ines','inés','rocio','rocío','mar',
  'mar','lupe','guadalupe','concepcion','concepción','paz','asuncion','asunción',
  'soledad','milagros','amparo','remedios','encarnacion','elena','patricia',
  'alejandra','margarita','gabriela','claudia','andrea','paola','isabel',
  'daniela','diana','natalia','lorena','adriana','sandra','silvia','monica',
  'laura','cristina','rosa','ana','lucia','marta','beatriz','teresa','pilar',
  'nuria','eva','alicia','sara','raquel','noelia','paloma','sonia','alba',
  'montserrat','laia','mireia','neus','meritxell','ariadna','irene','miren',
  'ane','itziar','maite','amaia','leire','nerea','garbiñe','nagore','alaitz',

  // ── Francês ──────────────────────────────────────────────────
  'camille','manon','margot','chloe','chloé','elise','élise','marie','lea','léa',
  'clemence','clémence','lucie','juliette','aurelie','aurélie','celine','céline',
  'noemie','noémie','margaux','mathilde','solene','solène','emilie','émilie',
  'helene','hélène','pauline','charline','colette','brigitte','odette','suzette',
  'yvette','jeannette','lisette','nanette','rachelle','chantal','fleur','geneviève',
  'genevieve','michèle','michele','nathalie','sandrine','sylvie','veronique',
  'véronique','isabelle','sophie','laure','amandine','amelie','amélie','clotilde',
  'corinne','delphine','dominique','elodie','élodie','francoise','françoise',
  'geraldine','géraldine','ingrid','jacqueline','joelle','joëlle','laurence',
  'madeleine','marianne','nadege','nadège','odile','pascale','regine','régine',
  'simone','therese','thérèse','valerie','valérie','yvonne','zoé','zoe',

  // ── Inglês / Americano ────────────────────────────────────────
  'jennifer','ashley','brittany','heather','amber','courtney','megan','whitney',
  'alexis','paige','brooke','faith','hope','grace','dawn','kim','sue','ann',
  'beth','joy','kate','abby','emma','olivia','charlotte','mia','aria','scarlett',
  'madison','zoe','penelope','lily','eleanor','addison','aubrey','ellie','stella',
  'natalie','zoey','hannah','lillian','avery','hazel','violet','savannah','audrey',
  'brooklyn','bella','claire','skylar','lucy','paisley','everly','anna','caroline',
  'nova','genesis','kennedy','samantha','maya','willow','kinsley','naomi','aaliyah',
  'allison','gabriella','madelyn','cora','ruby','eva','serenity','autumn','adeline',
  'hailey','gianna','isla','eliana','quinn','nevaeh','ivy','sadie','piper','lydia',
  'alexa','josephine','emery','julia','delilah','arianna','vivian','kaylee',
  'brielle','madeline','peyton','rylee','clara','hadley','melanie','mackenzie',
  'reagan','adalynn','liliana','aubree','katherine','natalia','raelynn','abigail',
  'taylor','jordan','morgan','riley','alexis','jessica','melissa','tiffany',
  'brittney','heidi','dawn','gloria','cynthia','diana','cheryl','carol','linda',
  'patricia','barbara','susan','dorothy','betty','margaret','lisa','deborah',
  'sandra','donna','carol','ruth','sharon','michelle','laura','sarah','kimberly',
  'debra','amy','angela','shirley','anna','brenda','pamela','emma','nicole',
  'helen','samantha','katherine','christine','debra','rachel','carolyn','janet',
  'catherine','frances','ann','joyce','diane','alice','julie','heather','teresa',
  'doris','gloria','evelyn','jean','cheryl','mildred','katherine','joan','ashley',
  'judith','rose','janice','kelly','nicole','judith','christina','kathy','theresa',
  'beverly','denise','tammy','irene','jane','lori','robin','marilyn','brittany',

  // ── Europa Oriental / Eslavo ──────────────────────────────────
  'olga','natasha','anastasia','katya','sonya','masha','oksana','yulia',
  'tatiana','svetlana','irina','ekaterina','darya','nadia','vera','galina',
  'tamara','larisa','valentina','marina','zoya','anya','vika','lena','olesya',
  'polina','dasha','alina','rina','zhanna','mila','tanya','lyudmila','liudmila',
  'nadya','nadja','veronika','sofiya','oksana','oksanka','olena','halyna',
  'tetyana','oksana','lyubov','svitlana','iryna','oksana','maryna','nataliia',
  'hanna','khrystyna','yaroslava','lesya','ulyana','roksolana','oksana',
  'tereza','martina','petra','hana','jana','monika','daniela','eva','anna',
  'barbora','klara','lenka','lucie','veronika','renata','zuzana','iveta',
  'gabriela','michaela','nikola','tereza','viktoriya','viktorija',

  // ── Italiano ─────────────────────────────────────────────────
  'chiara','ilaria','serena','giorgia','marta','noemi','alessia','arianna',
  'federica','simona','elena','paola','michela','cristina','lucia','claudia',
  'laura','catarina','giulia','rosa','rosa','alba','concetta','filomena',
  'grazia','immacolata','maristella','nunzia','ornella','raffaella','serafina',
  'stefania','giovanna','roberta','barbara','patrizia','daniela','francesca',
  'antonella','marisa','carla','luisa','lidia','rita','angela','anna','sara',
  'valentina','elisa','martina','sofia','giuliana','silvia','beatrice','viviana',
  'emanuela','letizia','benedetta','azzurra','ginevra','gaia','camilla','fiamma',

  // ── Japonês / Coreano / Chinês (comum no Brasil) ─────────────
  'yuki','naomi','akemi','harumi','keiko','kumiko','kyoko','mariko','michiko',
  'sachiko','satoko','sumiko','takako','tamiko','tomoko','yasuko','yoshiko',
  'yuko','yuriko','hana','sakura','rei','mai','ai','emi','aoi','nana','yui',
  'kana','saki','rin','moe','riko','ayaka','mizuki','hikari','ayumi','kaori',
  'natsuki','miyuki','megumi','miho','miku','minami','misaki','miyako','momoko',
  'noriko','rumi','sachi','shiho','suzu','yuna','yumi','junko','fumiko','chika',
  'chie','aya','asuka','haruka','hinata','honoka','ichika','koharu','kokoro',
  'mana','manami','mao','mayu','mikoto','mimi','mineko','sumi','tomomi',
  'jihyeon','jiyeon','minji','soyeon','jimin','yeji','chaeyeon','eunji',
  'yejin','seoyeon','seoyun','jiyeon','hyunji','suji','sooji','nari','hana',
  'jisoo','jennie','rose','lisa','tzuyu','sana','momo','nayeon','jihyo',

  // ── Árabe / Oriente Médio ────────────────────────────────────
  'aisha','fatima','amina','layla','nour','mariam','yasmin','leila','samira',
  'farida','nawal','rania','dina','mona','hala','rana','reem','iman','amal',
  'noura','heba','reham','nadine','maha','ghada','ola','hind','shereen',
  'rasha','amira','salma','samar','suha','wafa','zainab','zeina','sara','lana',

  // ── Africano (nomes comuns no Brasil) ───────────────────────
  'blessing','grace','mercy','favour','precious','amaka','ngozi','ifunanya',
  'nneka','adaeze','adaora','chidinma','chiamaka','chisom','faith',

  // ── Outros internacionais comuns ─────────────────────────────
  'ingrid','astrid','sigrid','frida','maja','anna','britta','karin','lena',
  'ulla','birgitta','elisabet','eva','maria','petra','annika','kaisa','sini',
  'tuuli','tiina','paivi','päivi','liisa','leena','minna','hanna','aino','siiri',
  'rosa','svetla','milena','borislava','elitsa','teodora','radoslava',
])

const MASCULINE = new Set([
  // ── Brasileiros / Portugueses ────────────────────────────────
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

  // ── Espanhol / Hispânico ─────────────────────────────────────
  'alejandro','alejo','alonso','álvaro','alvaro','andrés','andres','angel',
  'antonio','armando','arturo','bernardo','carlos','cesar','claudio','cristian',
  'diego','emilio','ernesto','esteban','ezequiel','facundo','federico','felix',
  'francisco','gerardo','gonzalo','guillermo','gustavo','hector','héctor',
  'ignacio','iñaki','ivan','javier','jorge','jose','juan','julian','julio',
  'leonidas','lorenzo','luis','manuel','marcos','mario','martin','mateo',
  'mauricio','miguel','nacho','nicolás','nicolas','pablo','patricio','pedro',
  'rafael','raul','roberto','rodrigo','ruben','rubén','salvador','santiago',
  'sebastian','tomás','tomas','victor','vicente','xavier','xavi',

  // ── Francês ──────────────────────────────────────────────────
  'antoine','julien','thomas','nicolas','pierre','paul','louis','jean','marc',
  'alexis','clement','clément','adrien','guillaume','maxime','romain','quentin',
  'florian','xavier','etienne','étienne','benoit','benoît','sebastien','sébastien',
  'matthieu','hugo','corentin','arthur','theo','théo','luc','gaetan','gaëtan',
  'thibaut','thibault','yann','loic','loïc','baptiste','brendan','damien',
  'gilles','herve','hervé','joel','joël','leo','léo','mickael','michaël',
  'raphael','raphaël','remi','rémi','stephane','stéphane','valentin','vincent',

  // ── Inglês / Americano ────────────────────────────────────────
  'james','john','robert','joseph','charles','thomas','christopher','matthew',
  'mark','donald','george','kenneth','steven','edward','ronald','anthony',
  'jason','gary','timothy','larry','jeffrey','frank','scott','stephen','andrew',
  'raymond','gregory','harry','patrick','jack','henry','walter','dennis','jerry',
  'alexander','peter','harold','carl','arthur','roger','albert','jonathan',
  'justin','terry','gerald','keith','willie','ralph','nicholas','roy','benjamin',
  'bruce','brandon','adam','fred','wayne','billy','steve','louis','jeremy','aaron',
  'randy','howard','eugene','russell','bobby','martin','ernest','phillip','todd',
  'jesse','craig','shawn','sean','philip','chris','johnny','earl','jimmy',
  'danny','bryan','mike','stanley','leonard','nathan','dale','manuel','rodney',
  'curtis','norman','allen','marvin','vincent','glenn','jeffery','travis','chad',
  'jacob','lee','melvin','alfred','kyle','francis','bradley','pete','fredrick',
  'herbert','ray','joel','edwin','don','eddie','ricky','troy','randall','barry',
  'bernard','mario','leroy','francisco','marcus','theodore','clifford','oscar',
  'jay','jim','tom','calvin','ron','ronnie','bill','lloyd','tommy','leon',
  'derek','warren','darrell','jerome','floyd','leo','alvin','tim','wesley',
  'gordon','dean','greg','dustin','derrick','dan','lewis','zachary','corey',
  'herman','mauricio','mauricio','roberto','clyde','glen','hector','shane',
  'sam','rick','lester','brent','ramon','charlie','tyler','gilbert','gene',
  'marc','reginald','ruben','brett','nathaniel','leslie','edgar','milton',
  'raul','ben','chester','jon','noah','ethan','liam','owen','aiden','elijah',
  'logan','mason','luke','jayden','ryan','hunter','david','dylan','jaxon',

  // ── Europa Oriental ───────────────────────────────────────────
  'aleksei','alexei','alexey','andrei','andrey','boris','dmitry','dmitri',
  'evgeny','evgeni','fyodor','fedor','igor','ivan','kirill','konstantin',
  'leonid','maxim','mikhail','nikita','nikolai','oleg','pavel','roman',
  'ruslan','sergei','sergey','timur','vadim','vasily','viktor','vladislav',
  'vladimir','yuri','yury','artem','artyom','stanislav','yaroslav','alexei',
  'jan','petr','pavel','jakub','marek','tomas','ondrej','radek','lukáš','lukas',
  'michal','martin','david','milan','miroslav','ondrej','roman','zdenek','jiri',

  // ── Italiano ─────────────────────────────────────────────────
  'luca','marco','matteo','andrea','davide','lorenzo','giovanni','antonio',
  'giuseppe','mario','luigi','roberto','stefano','riccardo','massimo','fabio',
  'claudio','gianluca','gianni','enrico','alberto','franco','filippo','daniele',
  'simone','emanuele','maurizio','vittorio','carlo','aldo','angelo','dario',
  'giuseppe','mauro','mirko','nicola','pasquale','salvatore','tommaso','vito',

  // ── Japonês / Coreano ────────────────────────────────────────
  'kenji','hiroshi','takeshi','daisuke','yosuke','taro','jiro','saburo',
  'kazuki','hayato','haruto','soma','riku','ryota','sho','sota','kota',
  'daiki','naoki','yuki','yuto','ken','makoto','satoshi','tetsuya','tsuyoshi',
  'noboru','akira','hideo','isamu','katsuya','keiichi','masahiro','masaki',
  'masao','masaru','mitsuo','norio','osamu','shigeru','shinji','shiro','tetsuo',
  'tomohiro','toshiyuki','yasuhiro','yasuo','yoshio','minseok','jungkook','taehyung',
  'seokjin','yoongi','hoseok','namjoon','jimin','junhoe','chanwoo','yunhyeong',

  // ── Árabe ────────────────────────────────────────────────────
  'ahmed','ali','omar','hassan','hussein','ibrahim','ismail','khalid','mahmoud',
  'mohamed','mohammad','mustafa','samir','youssef','yousef','walid','tariq',
  'samer','nasser','faisal','abdulrahman','ayman','badr','bilal','fawaz',

  // ── Nórdico / Germânico ──────────────────────────────────────
  'erik','lars','sven','bjorn','björn','torsten','hans','dieter','heinz',
  'helmut','horst','jochen','jürgen','jurgen','karl','manfred','otto','rolf',
  'walter','werner','gerhard','alfred','bernd','claus','detlef','eberhard',
  'frank','franz','friedrich','georg','gunter','günter','hartmut','herbert',
  'holger','joerg','jörg','leopold','lutz','norbert','peter','rainer','reinhard',
  'ruediger','rüdiger','sigmund','ulrich','uwe','volker','wolfram',
])

// Terminações femininas (mais conservadoras para evitar falsos positivos)
const FEMININE_ENDINGS = [
  'ela','ina','ana','ona','ane','ene','elle','elly','issa','essa','inha',
  'nia','cia','sia','zia','lla','ette','ette','ene','yne','ine','een',
  'leen','lene','ette','otte','euse','oise',
]
// Terminações masculinas (removido 'el' pois causa falsos positivos em Raquel, Isabel, Rachel)
const MASCULINE_ENDINGS = [
  'son','ton','aldo','ardo','erto','ilio','eiro','ão','ao','or',
  'uel','nel','inho','aldo','wald','berg','burg',
]

export type Gender = 'F' | 'M' | null

export function detectGender(fullName: string): Gender {
  if (!fullName?.trim()) return null

  const firstName = fullName.trim().split(/\s+/)[0].toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove diacritics for lookup

  const firstNameAccented = fullName.trim().split(/\s+/)[0].toLowerCase()

  // Dictionary lookup (with and without accents)
  if (FEMININE.has(firstNameAccented) || FEMININE.has(firstName)) return 'F'
  if (MASCULINE.has(firstNameAccented) || MASCULINE.has(firstName)) return 'M'

  // Suffix fallback
  for (const ending of FEMININE_ENDINGS) {
    if (firstName.endsWith(ending)) return 'F'
  }
  for (const ending of MASCULINE_ENDINGS) {
    if (firstName.endsWith(ending)) return 'M'
  }

  // General rule: names ending in -a tend to be feminine (with exceptions)
  if (firstName.endsWith('a') && !['luca','nikita','joshua','ayasha'].some(e => firstName === e)) return 'F'
  // Names ending in -o tend to be masculine
  if (firstName.endsWith('o')) return 'M'
  // Names ending in -i common in Japanese/Korean are often feminine
  if (firstName.endsWith('i') && firstName.length >= 3) return 'F'

  return null
}
