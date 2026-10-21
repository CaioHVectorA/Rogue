# Builds que mudam decisões

Toda run normal começa com o mesmo kit básico, sem escolher classe e sem habilidade equipada. As escolhas da run definem o estilo. Tiro básico continua exigindo parar. As habilidades funcionam em movimento para criar janelas de ataque, armadilhas ou uma alternativa de combate próximo.

## Ritmo da progressão

- Wave 1: um fragmento inicial de cargas, toxina ou fuga; sem troca de arma e sem explosão imediata de poder.
- Wave 2: primeira habilidade Q, com recarga curta. Wave 3 entrega uma melhoria da build e mantém E bloqueado.
- Wave 4: primeira forma alternativa de disparo, após vencer o boss.
- Wave 8: primeira ultimate E, após vencer o segundo boss.
- Waves 5–11: perks de comportamento, sinergias condicionais e novas formas de disparo. Nas waves 5, 7 e 10, habilidades novas também podem aparecer para substituir Q. Uma troca inicial, mais uma por chefe. Perks únicos evitam transformar a progressão em acumular percentuais; Coração de titã é a alternativa explícita de vida.
- Descanso: ouro treina oito atributos gerais do herói; no máximo duas compras por checkpoint e três níveis por atributo. Custos crescem por nível e ato. Não há compra de dano bruto nem cura consumível.

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

Os cards mostram uma cena animada do próprio modelo de combate (piloto verde, inimigos vermelhos, projéteis e áreas reais), efeito em texto e comando. Prévias são isoladas da run, silenciosas e não gravam recordes. Só cards visíveis são animados, a até 24 quadros/s; efeitos reduzidos mostram uma cena estática. As habilidades equipadas e o ataque têm explicações acessíveis pelo HUD/livro, com pausa e retorno ao combate. O laboratório também permite trocar o ataque automático.

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

## Ultimates e atributos

E é um recurso de combate, desbloqueado após a wave 8. Começa em 100 de carga; usar consome toda a carga e impõe uma trava mínima de 8s. Ataques diretos acertados geram 0,035 de carga por ponto de vida efetivamente removido, limitados a 6 de carga por segundo com reserva máxima de 6. Erros, espera, veneno periódico, reações secundárias e dano das ultimates não geram carga. Carga persiste entre waves; reiniciar a run a remove. As travas das fases dos bosses continuam valendo.

| Ultimate           | Decisão                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Olho da tempestade | Tempestade móvel de 5s, raio de 240, múltiplas descargas; a ativação apaga tiros próximos. Levar o herói à horda permite aproveitar a área.                                                 |
| Eclosão tóxica     | Consome doses existentes pela arena, causa dano e espalha impacto/doses a até quatro vizinhos por alvo. Planta três nuvens nos alvos próximos. Preparar veneno antes amplifica a detonação. |
| Cataclismo         | Três impactos de raios 160/250/340 no local da ativação, separados por 0,55s. Empurram, apagam tiros e ativam Catálise. O centro não acompanha o herói.                                     |

O arsenal separa atributos de perks. Vitalidade acrescenta 12 de vida máxima (preenche só os 12 novos); Cadência reduz o intervalo em 6% por nível; Agilidade soma 10 de velocidade; Resistência subtrai 1 de cada impacto, mínimo 1; Regeneração cura 1 por 10s ativos; Sintonia reduz a recarga de Q em 6%; Reflexos tira 0,18s da esquiva; Magnetismo amplia a atração em 35. Cada atributo aceita três níveis. Preço: `22 + 18 × nível atual + 5 × (ato − 1)`. O painel indica efeitos, níveis e limite de duas compras por checkpoint. Nenhum atributo fica salvo para a próxima run.

## Perks e combinações

| Grupo                            | Interação                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Ninho + perfuração + torre       | Permanecer parado arma um arpão em cada terceiro tiro; a torre cobre o reposicionamento         |
| Ricochete + disparo gêmeo        | Tiros divergentes procuram novos alvos após acertar; nenhum projétil repete alvo                |
| Poço + toxina + reação em cadeia | Concentre a horda, desacelere e espalhe explosões/veneno; explosão também funciona sem toxina   |
| Gatilho de fuga + rastro + mina  | Esquiva dispara para trás, recarrega a arma e deixa uma armadilha                               |
| Impacto + lâminas + fome         | Cura exige aproximação; lâminas destroem tiros próximos, mas contato e chão continuam perigosos |
| Eco + bateria                    | Ultimate deixa Q pronto com Eco; abates adiantam apenas Q com Bateria                           |
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

O primeiro fragmento oferece Núcleo estático, Frasco de toxina ou Gatilho de fuga. Nenhum troca a arma nem limpa uma horda sozinho. Q chega após a wave 2; E vira ultimate após a wave 8; a primeira escolha de arma é conquistada após o boss da wave 4. Novas formas de ataque trocam dano concentrado por cadência, alcance, perfuração, área ou preparação de elementos. O dano base rápido continua sendo uma opção válida. O arsenal vende oito atributos com três níveis cada e duas compras por checkpoint, sem aumentar o dano bruto. O bônus de saque do combo é limitado a 40%, e Febre do ouro dá duas moedas extras em vez de três.

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

Antes da introdução das ultimates e do novo arsenal, em simulações com invencibilidade e uso automático das habilidades, os quatro presets anteriores derrotavam o primeiro boss em 11–22s. Com os ajustes, ficaram em 18–51s; os novos presets de raio, veneno e híbrido em 35–45s. No mesmo cenário parado e sem habilidades da wave 3, a versão anterior completava o encontro com vida; a nova foi derrotada. Isso verifica pressão maior e duração relativa, sem substituir playtests humanos de esquiva, posicionamento e dificuldade.
