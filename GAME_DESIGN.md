# Builds que mudam decisões

O piloto oferece um ponto de partida; as escolhas da run definem o estilo. Tiro básico continua exigindo parar. As habilidades funcionam em movimento para criar janelas de ataque, armadilhas ou uma alternativa de combate próximo.

## Ritmo da progressão

- Wave 1: três poderes possíveis; E é o destino sugerido. É permitido trocar Q se o jogador preferir.
- Wave 2: outro draft de poderes; dois slots limitam a carga de comandos. O jogador escolhe qual ação substituir. Poderes equipados não aparecem nas ofertas.
- Waves 3–11: três perks de comportamento. Uma troca inicial, mais uma por chefe. Perks únicos evitam transformar a progressão em acumular percentuais; Coração de titã é a alternativa explícita de vida.
- Descanso: ouro compra cura ou melhoria modesta da arma. Poder de base acompanha os atos, enquanto os perks continuam definindo o comportamento.

## Habilidades

| Poder                | Recarga | Decisão que cria                                           |
| -------------------- | ------- | ---------------------------------------------------------- |
| Sobrecarga           | 3,2s    | Alinhar a horda ou acertar vários projéteis perto do alvo  |
| Nova arcana          | 4s      | Apagar tiros e afastar/desacelerar para abrir uma janela   |
| Impacto sísmico      | 4,5s    | Entrar em alcance para atingir e curar                     |
| Poço gravitacional   | 5s      | Agrupar inimigos no local de outro ataque                  |
| Tempestade iônica    | 4,2s    | Segurar uma passagem com pulsos durante 2,4s               |
| Sentinela de bolso   | 5,5s    | Plantar uma torre por 4s e reposicionar                    |
| Presente explosivo   | 3,8s    | Preparar uma mina com fusível de 0,45s e atrair a horda    |
| Coroa de lâminas     | 5s      | Entrar em contato protegido contra tiros próximos por 3,2s |
| Fantasma holográfico | 4,8s    | Abandonar uma isca que atrai inimigos e explode após 2,5s  |

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
| Casulo + retaliação              | Um impacto é bloqueado a cada seis segundos; dano real abre uma explosão e apaga tiros próximos |
| Bússola + febre do ouro          | Ser cercado aumenta os alvos possíveis, mas uma falha derruba o combo e seu bônus de saque      |

Efeitos persistentes não concedem invulnerabilidade permanente. Chefes resistem a puxão/repulsão, mas recebem dano. Iscas não desviam o boss. A mina explode quando um inimigo entra no alcance após o fusível ou quando expira; não prejudica o jogador.

## Combo e economia

Acertos de dano direto renovam a barra no máximo uma vez a cada 0,12s, evitando que uma rajada instantânea multiplique a contagem. Cada abate também conta. Veneno contínuo não mantém o combo sozinho.

A barra começa em 3,5s. O consumo é `1 + min(3, combo / 16)` e recebe um fator de 1,7 durante movimento. Em 40 de combo, uma barra cheia dura cerca de 1s parado e 0,59s em movimento se nenhum novo acerto acontecer. Tiros errados custam a janela perdida; não há reset instantâneo de uma rajada inteira por um projétil perdido. Dano reduz a barra restante; com Febre do ouro, zera a sequência.

A chance de ouro extra é `min(65%, max(0, combo - 2) × 1,8%)` por abate. Mantém-se uma moeda base (três em guardas e 35 em bosses). O bônus vale uma moeda, ou três com Febre do ouro. Isso dá progresso mesmo fora do combo e limita o crescimento. O saque tem RNG próprio por seed/sala: partículas e duração da luta não alteram a sequência de sorteios.

## Chefes

Vida por ato: 1800 / 3600 / 5400. Os marcos de 75%, 50% e 25% impedem um ataque enorme de saltar fases. Cada transição dura 1,2s, limpa projéteis hostis, mantém avisos de chão existentes e anuncia a mudança. Dano excedente do golpe que alcança o marco não atravessa a próxima fase.

1. Leitura: anéis com espaço, alternados com círculos de posição fixa. Intervalo de 2,7s.
2. Cerco: anéis mais densos/rápidos e áreas adicionais. Intervalo de 2,2s.
3. Ruptura: anel secundário em rotação contrária e reforços limitados por transição. Intervalo de 1,9s.
4. Colapso: cruz de perigos anunciados ao redor de uma posição capturada, além dos padrões anteriores. Intervalo de 1,6s.

Cada ato adiciona complexidade: a Tecelã tem leques direcionados e o Soberano mistura leques maiores. Avisos duram pelo menos 1,1s; não seguem o jogador depois de nascer. O objetivo é prolongar a leitura e execução da luta. Duração ideal e dificuldade ainda dependem de playtests humanos.

## Laboratório

Frasco ou F2, disponível no build publicado. Estado, wave, fase, piloto, quatro presets e kit básico; edição de habilidades/perks, invencibilidade, velocidade e limpeza de wave. Abrir pausa. Saltar começa outra run, marcada como prática, com 250 de ouro. Prática não escreve recordes e suas modificações são descartadas no próximo início normal.
