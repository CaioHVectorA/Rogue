# Rogue — Encontre seu ritmo

Roguelite de arena para navegador, em português. Mova-se para escapar; pare para disparar automaticamente no alvo mais próximo. A recarga continua a 65% enquanto você se move.

## Jogar e desenvolver

Requer Node.js 22 e npm (`.nvmrc` e Vercel usam a mesma versão).

```sh
npm ci
npm run dev
```

Abra http://localhost:3001. Para gerar uma versão estática, `npm run build`; para verificá-la, `npm run preview`. O diretório `dist/` funciona em hospedagens estáticas, inclusive em subdiretórios. Não há backend ou serviços externos.

## Uma run

- Escolha Atirador (rajada), Conjurador (nova) ou Colosso (impacto e cura).
- Atravesse três atos de quatro encontros. Cada ato termina com um guardião.
- Escolha uma entre três melhorias ao vencer um encontro. As sinergias incluem veneno e explosões, perfuração e tiro duplo, defesa e sustentação.
- No descanso, compre cura ou dano com o ouro coletado. A coleta restante é automática ao limpar a sala.
- Chefes anunciam ataques e entram em uma segunda fase com metade da vida. Vencer o terceiro encerra a run.
- A derrota encerra a run. Só recordes ficam no navegador; não há poder permanente nem retomada após recarregar.

No desktop: WASD/setas para movimento, Espaço para esquiva, Q para habilidade e Esc para pausa. No celular: arraste o controle esquerdo e solte para atirar; use os botões da direita sem soltar o outro dedo. As recargas aparecem nos botões.

A interface detecta tamanho de tela e ponteiro de toque, com seletor Auto/Celular/Desktop no topo e preferência salva neste navegador. O celular tem menu e HUD próprios, arena adaptada em pé ou deitado e áreas de controle fora do campo de batalha. Girar a tela pausa a run e preserva o progresso. Saída da aba também pausa. Som pode ser desligado; a preferência de redução de movimento do sistema é respeitada.

O código da run reproduz posições de spawn e sorteios de recompensa para as mesmas escolhas de build e de troca. Cada encontro usa sua própria sequência, independente do tempo de combate. A diária usa a data UTC. Não há placar online nem promessa de igualdade entre caminhos diferentes.

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

Esta versão substitui o protótipo em Kaplay por uma simulação TypeScript, arena Canvas 2D e interface HTML/CSS. O histórico Git preserva os sistemas anteriores. `ORIGINAL_REQUEST.md` registra o pedido histórico do protótipo, não a especificação atual.
