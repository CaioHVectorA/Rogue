# Direção e arquitetura

## Pilares

1. **Posicionamento é ataque.** O tiro básico exige ficar parado; mira automática e recarga visível reduzem a carga de comandos. Q, E e esquiva abrem janelas sem apagar essa tensão.
2. **Uma decisão por vez.** Menu → combate → recompensa → descanso → combate. Pausa e resultado são estados exclusivos. Sem loja sobreposta a combate nem recursos competindo pela mesma compra.
3. **Runs completas e finitas.** 12 salas, três atos e chefes nas salas 4, 8 e 12. Cada chefe derrotado recupera 25% da vida e concede uma troca de ofertas. A última sala leva diretamente à vitória.
4. **Clareza antes de quantidade.** Um kit inicial comum, quatro famílias de inimigos comuns, nove habilidades, 16 perks e três variantes de guardião. Forma, cor, contorno e movimento distinguem ameaças.

## Sistemas

- **Combate:** passo fixo de 120 Hz; movimento normalizado; colisões por áreas do Kaplay, com áreas varridas para projéteis; recarga a 65% em movimento; esquiva de 0,18s com proteção de 0,28s e cooldown base de 2,6s; proteção global de 0,75s após dano.
- **Chefes:** Sentinela introduz anéis e áreas; Tecelã adiciona leques direcionados e mais áreas; Soberano combina padrões mais densos. Quatro fases em 75/50/25% da vida. Intervalos caem de 2,7s a 1,6s, entram anéis adicionais, reforços e perigos em cruz. Cada transição protege o boss por 1,2s e limpa tiros hostis. Avisos de área fixam a posição ao nascer e antecipam o impacto em pelo menos 1,1s.
- **Progressão:** ofertas sem repetição e sem melhorias já no limite; uma troca inicial e mais uma por chefe; cura e reforços comprados só no descanso. Cura limitada a uma e reforços a dois por descanso. Ouro de chão é recolhido ao concluir.
- **Sinergias:** habilidades usam o dano da arma e interações próprias; zonas persistentes são limitadas a seis; a fila de mortes resolve explosões sem recursão e sem duplicar ouro. Casulo reativo bloqueia um impacto e recarrega em seis segundos.
- **Seeds:** gerador reproduzível; sorteios de melhoria independem do tempo de combate. Aleatoriedade cosmética não consome a sequência de gameplay. Posições e timers de cada sala usam uma sequência própria.
- **Persistência:** registros validados em `rogue.records.v2`; só runs concluídas contam. Falha de armazenamento não impede jogar. Sem salvamento de run nem metaprogressão de poder.

## Módulos

| Arquivo               | Responsabilidade                                                    |
| --------------------- | ------------------------------------------------------------------- |
| `src/game/model.ts`   | Tipos, conteúdo, seeds, recompensas, rota e recordes                |
| `src/game/engine.ts`  | Máquina de estados, combate, economia, chefes e eventos de feedback |
| `src/game/kaplay.ts`  | Runtime Kaplay: cenas, entidades, colisões, câmera, efeitos e áudio |
| `src/ui/interface.ts` | Telas HTML, ações validadas, foco e HUD                             |
| `src/ui/style.css`    | Sistema visual, responsividade e redução de movimento               |
| `src/main.ts`         | Inicialização, input, visibilidade e adaptação do campo             |

## Runtime e feedback

`KaplayRuntime` cria a cena `arena`, mantém os modelos de jogador, inimigos, tiros, perigos e drops como entidades Kaplay e recebe os eventos `onCollideUpdate` da engine. Renderização usa as primitivas WebGL da engine; não há mais renderizador Canvas 2D próprio. O callback `onUpdate` do Kaplay executa as regras em passos de 120 Hz. Um novo início de run recria a cena, removendo entidades, timers e efeitos anteriores.

A lógica de regras continua independente das telas. O movimento intencional é calculado pelo modelo e sincronizado com as entidades; a detecção espacial e os callbacks de colisão pertencem ao Kaplay. Um caminho de colisões sem cena permanece apenas para simulações headless. Partículas usam componentes `move`, `lifespan`, `opacity` e `rotate`, com orçamento de 240 no celular e 650 no desktop, mais até 30 anéis; o modo reduzido usa até 45 partículas e desliga câmera, hit stop e números de dano. Sons WAV locais são sintetizados no repositório e carregados/reproduzidos pelo Kaplay.

Hordas crescem de 18 inimigos básicos a mais de 70 ameaças mistas. A separação usa células espaciais em vez de comparar todos os pares. As unidades comuns são frágeis e as rajadas têm recargas entre 0,36s e 0,46s antes de upgrades. Chefes usam 1800/3600/5400 HP e sua morte colapsa os reforços. Combo conta acertos/abates, tem janela base de 3,5s com consumo crescente por combo e movimento e gera ouro extra com chance limitada a 65%. O RNG de saque é separado dos spawns e das ofertas. O laboratório público cria apenas runs de prática sem gravar recordes.

## Interface

Sem fontes ou imagens remotas. Paleta de azul noturno, amarelo, verde menta e violeta. Ícones vetoriais, desenho geométrico e pilotos vetoriais, silhuetas de equipamento e números curtos no lugar de parágrafos. Botões HTML preservam teclado e foco visível; diálogos contêm navegação por Tab; nenhuma informação essencial depende de áudio. A arena é visual e não fornece uma experiência completa para leitores de tela.

O modo móvel é selecionado por largura e tipo de ponteiro, sem identificar o navegador por user-agent. Usuários podem escolher manualmente, inclusive em tablets e computadores híbridos. Menu e HUD móveis usam marcação própria. A arena inteira é ajustada à área de jogo, preservando sua área total e reservando espaço para os controles; a distribuição do espaço muda entre orientações e pode alterar a dificuldade de posicionamento.

Ao redimensionar o campo durante combate, o jogo pausa e remapeia jogador, inimigos, disparos, avisos, drops, zonas amigáveis e spawns por posição relativa. Nenhum inimigo fica escondido por recorte de câmera. O renderizador WebGL limita a resolução a 1,5x e as ações respondem a `pointerdown`, com captura independente do dedo que move. A troca de tela limpa entradas; ajustes de som não interrompem o controle de movimento.

| Módulo de adaptação    | Responsabilidade                                              |
| ---------------------- | ------------------------------------------------------------- |
| `src/ui/device.ts`     | Detecção por capacidades, troca manual e preferência local    |
| `src/ui/mobile.css`    | Composição móvel, áreas seguras e layouts por orientação      |
| `src/ui/touch.ts`      | Captura de ponteiros, ações simultâneas e cancelamento seguro |
| `src/game/viewport.ts` | Geometria da arena por proporção, preservando a área do mundo |

## Hospedagem

`vercel.json` define Vite, instalação reproduzível e saída estática `dist`. Node.js 22 é usado na CI e na Vercel. Nenhum segredo ou serviço remoto é necessário. A integração com a conta Vercel e a criação do projeto ficam a cargo do proprietário.

## Limites atuais

O balanceamento inicial é coberto por simulações e testes de fluxo, mas precisa de sessões humanas com diferentes níveis de habilidade. Os três chefes compartilham uma base geométrica e comportamental, com padrões progressivos. Não há conteúdo narrativo extenso, salvamento de run, multiplayer ou placar remoto.
