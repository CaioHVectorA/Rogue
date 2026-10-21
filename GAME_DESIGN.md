# Builds que mudam decisões

Toda run normal começa com o mesmo kit básico, sem escolher classe e sem habilidade equipada. As escolhas da run definem o estilo. Tiro básico continua exigindo parar. As habilidades funcionam em movimento para criar janelas de ataque, armadilhas ou uma alternativa de combate próximo.

## Ritmo da progressão

- Wave 1: um fragmento inicial de cargas, toxina ou fuga; sem troca de arma e sem explosão imediata de poder.
- Waves 2 e 3: receba Q e E, com slots vazios sugeridos automaticamente. Poderes equipados não aparecem nas ofertas.
- Wave 4: primeira forma alternativa de disparo, após vencer o boss.
- Waves 5–11: perks de comportamento, sinergias condicionais e novas formas de disparo. Uma troca inicial, mais uma por chefe. Perks únicos evitam transformar a progressão em acumular percentuais; Coração de titã é a alternativa explícita de vida.
- Descanso: ouro compra cura ou melhoria modesta da arma. Poder de base acompanha os atos, enquanto os perks continuam definindo o comportamento.

## Formas de ataque automático

Pare para atacar. A wave 4 oferece três armas; novos modelos podem aparecer depois. O arsenal permite alternar livremente entre modelos já adquiridos, fora de combate. Armas e habilidades são sistemas separados.

| Ataque           | Intervalo base | Alcance              | Comportamento                                               |
| ---------------- | -------------- | -------------------- | ----------------------------------------------------------- |
| Pistola de pulso | 0,20s          | 850                  | Disparo inicial rápido, 22 de dano                          |
| Metralhadora     | 0,14s          | 700                  | Alta cadência, menor dano por projétil                      |
| Escopeta         | 0,50s          | 290                  | Sete chumbos curtos; aproximar concentra o dano             |
| Emissor sísmico  | 0,60s          | 135                  | Atinge só o círculo ao redor, sem projéteis                 |
| Arco elétrico    | 0,36s          | 340 no primeiro alvo | Choque salta por até três alvos, com saltos menores que 190 |
| Lança perfurante | 0,50s          | 950                  | Disparo pesado atravessa até cinco inimigos                 |

Armas curtas não desperdiçam recarga se todos estiverem fora do alcance. Escopeta expira os chumbos no alcance e não recebe extensão por ricochete. Ondas sísmicas mostram o círculo de alcance; a escopeta mostra os limites do cone. Perks exclusivos de projéteis não são oferecidos enquanto emissor sísmico ou arco elétrico estão equipados; os já adquiridos continuam disponíveis ao voltar para outra arma. Habilidades e armas usam o dano-base, com fatores próprios de cada padrão.

Os cards mostram um diagrama (piloto verde, inimigos vermelhos, área de atuação), efeito em texto e comando. As habilidades equipadas e o ataque têm explicações acessíveis pelo HUD/livro, com pausa e retorno ao combate. O laboratório também permite trocar o ataque automático.

## Habilidades

| Poder               | Recarga | Decisão que cria                                           |
| ------------------- | ------- | ---------------------------------------------------------- |
| Rajada perfurante   | 3,2s    | Alinhar a horda ou acertar vários projéteis perto do alvo  |
| Onda de repulsão    | 4s      | Apagar tiros e afastar/desacelerar para abrir uma janela   |
| Pisada sísmica      | 4,5s    | Entrar em alcance para atingir e curar                     |
| Ímã gravitacional   | 5s      | Agrupar inimigos no local de outro ataque                  |
| Chuva de raios      | 4,2s    | Segurar uma passagem com pulsos durante 2,4s               |
| Torre automática    | 5,5s    | Plantar uma torre por 4s e reposicionar                    |
| Mina de proximidade | 3,8s    | Preparar uma mina com fusível de 0,45s e atrair a horda    |
| Lâminas orbitais    | 5s      | Entrar em contato protegido contra tiros próximos por 3,2s |
| Isca explosiva      | 4,8s    | Abandonar uma isca que atrai inimigos e explode após 2,5s  |

Zonas amigáveis têm cor fria/âmbar e geometria própria, distinta dos círculos vermelhos de dano inimigo. Até seis zonas coexistem. Torre e ataques de habilidades usam o mesmo sistema de projéteis/colisões do Kaplay. Zonas fazem consultas radiais no modelo; o Kaplay desenha o estado e seus efeitos.

## Perks e combinações

| Grupo                            | Interação                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Ninho + perfuração + torre       | Permanecer parado arma um arpão em cada terceiro tiro; a torre cobre o reposicionamento         |
| Ricochete + disparo gêmeo        | Tiros divergentes procuram novos alvos após acertar; nenhum projétil repete alvo                |
| Poço + toxina + reação em cadeia | Concentre a horda, desacelere e espalhe explosões/veneno; explosão também funciona sem toxina   |
| Gatilho de fuga + rastro + mina  | Esquiva dispara para trás, recarrega a arma e deixa uma armadilha                               |
| Impacto + lâminas + fome         | Cura exige aproximação; lâminas destroem tiros próximos, mas contato e chão continuam perigosos |
| Eco + bateria                    | Alternar Q/E adianta a outra recarga; abates abastecem ambas                                    |
| Casulo + retaliação              | Um impacto é bloqueado a cada oito segundos; dano real abre uma explosão e apaga tiros próximos |
| Bússola + febre do ouro          | Ser cercado aumenta os alvos possíveis, mas uma falha derruba o combo e seu bônus de saque      |

Efeitos persistentes não concedem invulnerabilidade permanente. Chefes resistem a puxão/repulsão, mas recebem dano. Iscas não desviam o boss. A mina explode quando um inimigo entra no alcance após o fusível ou quando expira; não prejudica o jogador.

## Combo e economia

Acertos de dano direto renovam a barra no máximo uma vez a cada 0,12s, evitando que uma rajada instantânea multiplique a contagem. Cada abate também conta. Veneno contínuo não mantém o combo sozinho.

A barra começa em 3,5s. O consumo é `1 + min(3, combo / 16)` e recebe um fator de 1,7 durante movimento. Em 40 de combo, uma barra cheia dura cerca de 1s parado e 0,59s em movimento se nenhum novo acerto acontecer. Tiros errados custam a janela perdida; não há reset instantâneo de uma rajada inteira por um projétil perdido. Dano reduz a barra restante; com Febre do ouro, zera a sequência.

A chance de ouro extra é `min(40%, max(0, combo - 2) × 1,2%)` por abate. Mantém-se uma moeda base (três em guardas e 35 em bosses). O bônus vale uma moeda, ou duas com Febre do ouro. Isso dá progresso mesmo fora do combo e limita o crescimento. O saque tem RNG próprio por seed/sala: partículas e duração da luta não alteram a sequência de sorteios.

## Chefes

Vida por ato: 2700 / 5700 / 8700. Os marcos de 75%, 50% e 25% impedem um ataque enorme de saltar fases. Cada transição dura 1,2s, limpa projéteis hostis, mantém avisos de chão existentes e anuncia a mudança. Dano excedente do golpe que alcança o marco não atravessa a próxima fase.

1. Leitura: anéis com espaço, alternados com círculos de posição fixa. Intervalo de 2,4s.
2. Cerco: anéis mais densos/rápidos e áreas adicionais. Intervalo de 2s.
3. Ruptura: anel secundário em rotação contrária e reforços limitados por transição. Intervalo de 1,75s.
4. Colapso: cruz de perigos anunciados ao redor de uma posição capturada, além dos padrões anteriores. Intervalo de 1,5s.

Cada ato adiciona complexidade: a Tecelã tem leques direcionados e o Soberano mistura leques maiores. Avisos duram pelo menos 1,1s; não seguem o jogador depois de nascer. O objetivo é prolongar a leitura e execução da luta. Duração ideal e dificuldade ainda dependem de playtests humanos.

## Laboratório

Frasco ou F2, disponível no build publicado. Estado, wave, fase, piloto, quatro presets e kit básico; edição de habilidades/perks, invencibilidade, velocidade e limpeza de wave. Abrir pausa. Saltar começa outra run, marcada como prática, com 250 de ouro. Prática não escreve recordes e suas modificações são descartadas no próximo início normal.

## Rebalanceamento: progressão gradual e builds elementais

O primeiro fragmento oferece Núcleo estático, Frasco de toxina ou Gatilho de fuga. Nenhum troca a arma nem limpa uma horda sozinho. Q/E chegam após waves 2 e 3; a primeira escolha de arma é conquistada após o boss da wave 4. Novas formas de ataque trocam dano concentrado por cadência, alcance, perfuração, área ou preparação de elementos. O dano base rápido continua sendo uma opção válida. A loja oferece uma melhoria fixa de dois pontos de calibre por descanso, com limite de uma compra: não há mais crescimento composto de dano. O bônus de saque do combo é limitado a 40%, e Febre do ouro dá duas moedas extras em vez de três.

### Raio

Ataques elétricos (arco ou tempestade) e o Núcleo estático acumulam quatro cargas no alvo. A quarta produz uma descarga leve que salta para um vizinho. Uma janela de 0,12s por inimigo impede que sete chumbos produzam sete reações. Cargas restantes podem passar a um vizinho no abate, sem disparar outra reação automaticamente. Dano secundário não reaplica marcas.

- **Para-raios:** a torre prioriza alvos carregados, consome suas cargas e atinge até dois vizinhos.
- **Aterramento:** esquivar consome cargas próximas e transforma o acúmulo em dano e uma abertura para escapar.
- **Gaiola de Faraday:** tempestade dentro do ímã consome cargas para saltar entre alvos. Exige posicionar duas habilidades em sequência.

### Veneno

Até quatro doses ficam no alvo por três segundos. Cada dose causa dano gradual; o veneno deixou de desacelerar automaticamente. Agulha tóxica aplica duas doses e perfura dois alvos. Frasco ácido cria uma nuvem que prepara doses, sem exigir o item inicial.

- **Catalisador sísmico:** emissor sísmico, pisada e minas consomem três ou mais doses para causar dano imediato. A catálise gasta o dano gradual preparado.
- **Jardim fúngico:** mortes com duas doses deixam nuvens curtas. Até três jardins coexistem, dentro do orçamento global de seis zonas.
- **Estopim tóxico:** mortes com três doses explodem para até cinco vizinhos e transferem uma dose. A cadeia exige preparação; não acontece em qualquer abate.
- **Melaço tóxico:** o controle de movimento só aparece após três doses.
- **Eletrólise:** a sobrecarga transporta até duas doses existentes para os alvos do salto. Não multiplica doses livremente.

Ofertas condicionais exigem suas peças de entrada; por exemplo, Para-raios exige torre e acesso a cargas. Um espaço do draft favorece uma sinergia utilizável; os outros mantêm possibilidades de mudança. Cards mostram a ligação entre as peças e o arsenal mostra cargas/doses e contadores de reações. Os estilos aparecem durante a run, sem escolher classe no menu.

### Pressão dos encontros

Hordas misturam perseguidores, flanqueadores, atiradores e guardas durante o encontro, em grupos sucessivos. Atiradores chegam desde a primeira wave e guardas desde a segunda. Unidades comuns resistem a mais de um tiro básico; atiradores e guardas têm leques de projéteis. O total cresce de 23 ameaças na primeira wave para 69 na wave 11, com aumento de resistência e velocidade por ato.

Bosses têm 2700/5700/8700 HP, os mesmos quatro marcos de fase e intervalos de ataque de 2,4/2/1,75/1,5s. Da segunda fase em diante, algumas sequências anunciam uma investida por 0,8s. A direção é capturada no anúncio, sem seguir o jogador. Órbita corta um número limitado de tiros e sustentação/recargas não multiplicam o benefício de dezenas de mortes no mesmo instante.

### Celular

A arena usa mais altura em retrato e mais largura em paisagem. Cabeçalho compacto e controles fora do campo preservam a leitura sem cobrir ameaças. O mundo móvel mantém 82% da área do desktop, constante entre orientações, aumentando a escala aparente de personagens e projéteis; toda a arena continua visível. Redimensionar ainda pausa e remapeia posições.

### Referência de validação

Em simulações com invencibilidade e uso automático das habilidades, os quatro presets anteriores derrotavam o primeiro boss em 11–22s. Com os ajustes, ficaram em 18–51s; os novos presets de raio, veneno e híbrido em 35–45s. No mesmo cenário parado e sem habilidades da wave 3, a versão anterior completava o encontro com vida; a nova foi derrotada. Isso verifica pressão maior e duração relativa, sem substituir playtests humanos de esquiva, posicionamento e dificuldade.
