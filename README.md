# Rogue — Encontre seu ritmo

Roguelite de arena para navegador, em português. Mova-se para escapar; pare para disparar automaticamente no alvo mais próximo. A recarga continua a 65% enquanto você se move.

## Jogar e desenvolver

Requer Node.js 22 e npm (`.nvmrc` e Vercel usam a mesma versão).

```sh
npm ci
npm run dev
```

Abra http://localhost:3001. Para gerar uma versão estática, `npm run build`; para verificá-la, `npm run preview`. O diretório `dist/` funciona em hospedagens estáticas, inclusive em subdiretórios. Não há backend ou serviços externos.

No desenvolvimento, o inspetor nativo do Kaplay está habilitado (clique na arena e pressione F1). O runtime pode ser explorado no console em `window.__kaplay`; esses recursos de depuração ficam desativados no build de produção. Para regenerar os sons locais: `python3 scripts/generate-sfx.py`.

## Combate arcade

Hordas de 18 a mais de 70 inimigos, com unidades básicas mais frágeis, rajadas frequentes e patrulhas misturadas. Chefes têm escala visual maior e a sua queda elimina a horda restante. Acertos e abates alimentam o combo. A barra base de 3,5s consome mais rápido conforme o combo sobe (até 4×) e ainda mais durante movimento (1,7×). O combo aumenta a chance de uma moeda extra por abate até 40%; Febre do ouro transforma esse bônus em duas moedas e zera a sequência ao sofrer dano. O bônus aparece no HUD e não aumenta dano.

Impactos incluem fragmentos, rastros, números de dano, ondas de choque, pausas curtas de impacto e sons locais reproduzidos pelo Kaplay. A quantidade de efeitos é limitada a 240 partículas no celular e 650 no desktop, com pequena reserva para anéis e indicadores. O modo reduzido remove tremor, pausas e números flutuantes e limita partículas a 45. Está no botão de configurações e respeita a preferência inicial do sistema.

Apresentação visual da run, melhorias por ícones/atributos e arsenal substituem os painéis de texto. O botão de livro na seleção de melhorias abre as descrições completas. As opções de interface ficam na engrenagem.

## Uma run

- Aperte Jogar: todas as runs normais começam com o mesmo kit básico, com pistola rápida e sem habilidades. A identidade da build surge nas escolhas durante o combate, sem seleção inicial de classe.
- Atravesse três atos de quatro encontros. Cada ato termina com um guardião.
- Na wave 1, escolha uma relíquia inicial. Nas waves 2 e 3, receba suas primeiras habilidades Q/E; a primeira arma alternativa chega após o boss da wave 4. Há dez poderes com recargas de 3,2 a 5,5s.
- Nas waves seguintes, escolha entre perks que alteram comportamentos: ricochete, arpão ao permanecer parado, esquiva com contrafogo, minas de plasma, escudo reativo e explosões em cadeia. Há 24 perks; o coração pode repetir, os demais são únicos.
- No descanso, compre cura ou dano com o ouro coletado. A coleta restante é automática ao limpar a sala.
- Chefes têm 2700/5700/8700 de vida e quatro fases, separadas nos marcos de 75/50/25%. Transições de 1,2s apagam tiros hostis e anunciam a próxima fase. Padrões ficam mais rápidos, ganham anéis cruzados, reforços e uma cruz de perigos no colapso final. Vencer o terceiro encerra a run.
- A derrota encerra a run. Só recordes ficam no navegador; não há poder permanente nem retomada após recarregar.

No desktop: WASD/setas para movimento, Espaço para esquiva, Q e E para habilidades e Esc para pausa. No celular: arraste o controle esquerdo e solte para atirar; use os botões da direita sem soltar o outro dedo. As recargas aparecem nos botões.

A interface detecta tamanho de tela e ponteiro de toque, com seletor Auto/Celular/Desktop nas configurações e preferência salva neste navegador. O celular tem menu e HUD próprios, arena adaptada em pé ou deitado e áreas de controle fora do campo de batalha. Girar a tela pausa a run e preserva o progresso. Saída da aba também pausa. Som pode ser desligado; a preferência de redução de movimento do sistema é respeitada.

O código da run reproduz posições de spawn e sorteios de recompensa para as mesmas escolhas de build e de troca. Cada encontro usa sua própria sequência, independente do tempo de combate. A diária usa a data UTC. Não há placar online nem promessa de igualdade entre caminhos diferentes.

## Ataques e habilidades

O tiro inicial é mais rápido e forte: 22 de dano a cada 0,20s. Durante a run, conquiste formas alternativas como metralhadora, escopeta de sete chumbos, emissor sísmico que só acerta quem está perto, arco elétrico em cadeia, agulhas tóxicas ou disparo pesado perfurante. Cada arma troca vantagens por limites; não é um salto automático de dano. O arsenal preserva os modelos adquiridos para trocar entre encontros.

Os cards de armas e habilidades mostram onde o poder age e como ativar. O ataque equipado pode ser consultado pelo HUD; o livro reúne explicações dos poderes da build. O jogador verde e os alvos vermelhos dos diagramas distinguem ataques ao redor, cones e áreas no inimigo.

## Raio e veneno

Raio acumula cargas e provoca sobrecargas; torres e esquivas podem consumir essas cargas. Veneno prepara doses para contágio, controle ou catálise com impactos sísmicos. A Eletrólise liga os dois: descargas transportam doses já aplicadas. O draft favorece combinações utilizáveis e os cards mostram o vínculo entre arma, habilidade e perk.

A dificuldade das waves também cresce: ameaças mistas chegam em grupos sucessivos, inimigos comuns não caem todos com um tiro e os bosses podem investir após anunciar a direção. O celular ganhou arena maior e personagens mais legíveis, com os controles preservados fora do campo.

## Laboratório de gameplay

O frasco no cabeçalho, a opção nas configurações ou **F2** abrem o laboratório, inclusive na Vercel. Escolha estado (combate, recompensa, arsenal ou resultado), wave, boss/fase, piloto e preset. Saltar reinicia a run com 250 de ouro e marca **LAB** no campo; a prática nunca grava recordes. Uma run normal reinicia sem cheats ou poderes transferidos.

Durante a prática, reabra o frasco para trocar Q/E, adicionar perks, ativar invencibilidade, mudar o ritmo entre 0,5× e 3× e limpar o encontro. O painel pausa o combate. F1 e os objetos de console continuam exclusivos do servidor de desenvolvimento.

| Estilo   | Habilidades               | Interação                                                    |
| -------- | ------------------------- | ------------------------------------------------------------ |
| Controle | Poço + tempestade         | Agrupe, desacelere e provoque reações em cadeia              |
| Atirador | Rajada perfurante + torre | Crie cobertura e pare para preparar o arpão                  |
| Briga    | Impacto + lâminas         | Entre na horda, bloqueie e recupere vida com abates próximos |
| Truques  | Holograma + mina          | Atraia a horda, deixe armadilhas e ataque ao fugir           |

Os presets são atalhos de teste. Em runs normais a build surge das ofertas e pode misturar livremente esses estilos. Detalhes de balanceamento: [GAME_DESIGN.md](GAME_DESIGN.md).

## Validação

```sh
npm test
npm run typecheck
npx playwright install --with-deps chromium webkit
npm run test:e2e
npm run build
```

Os testes de navegador cobrem Chromium e WebKit, incluindo contextos móveis. O teste de dois dedos usa entrada de toque nativa via CDP no Chromium. Isso não substitui testes em aparelhos reais.

## Publicar na Vercel

1. Na Vercel, escolha **Add New → Project** e importe `CaioHVectorA/Rogue` do GitHub, usando a branch `main`.
2. A configuração é automática pelo `vercel.json`: **Vite**, diretório raiz do repositório, instalação `npm ci`, build `npm run build`, saída `dist` e Node.js 22.
3. Não configure variáveis de ambiente. Clique em **Deploy** e abra o endereço gerado no computador e no celular.

Depois de conectado, novos pushes na `main` geram deploys de produção e pull requests podem gerar previews pela integração Git da Vercel. O site é estático e não precisa de API, banco de dados ou serviço de autenticação. Esta configuração prepara o repositório; conectar a conta e criar o projeto é feito na sua Vercel.

Prévias: [celular em pé](docs/preview/mobile-portrait.png), [celular deitado](docs/preview/mobile-landscape.png) e [menu do celular](docs/preview/mobile-menu.png).

Regras e decisões: [PROJECT.md](PROJECT.md). Próximos passos: [roadmap.md](roadmap.md).

O jogo usa Kaplay.js 3001 como runtime: cenas, entidades, renderização WebGL, colisões, áudio e efeitos. As regras de runs ficam em TypeScript e as interfaces acessíveis em HTML/CSS. O histórico Git preserva os sistemas anteriores. `ORIGINAL_REQUEST.md` registra o pedido histórico do protótipo, não a especificação atual.
