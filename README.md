# Rogue — Encontre seu ritmo

Roguelite de arena para navegador, em português. Mova-se para escapar; pare para disparar automaticamente no alvo mais próximo. A recarga continua a 65% enquanto você se move.

## Jogar e desenvolver

Requer Node.js 22.12+ (ou 20.19+) e npm.

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

WASD/setas: movimento. Espaço: esquiva com invulnerabilidade. Q: habilidade. Esc: pausa. Controles de toque aparecem em dispositivos com ponteiro de toque. Saída da aba pausa automaticamente. Som pode ser desligado; a preferência de redução de movimento do sistema é respeitada.

O código da run reproduz posições de spawn e sorteios de recompensa para as mesmas escolhas de build e de troca. Cada encontro usa sua própria sequência, independente do tempo de combate. A diária usa a data UTC. Não há placar online nem promessa de igualdade entre caminhos diferentes.

## Validação

```sh
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run build
```

Regras e decisões: [PROJECT.md](PROJECT.md). Próximos passos: [roadmap.md](roadmap.md).

Esta versão substitui o protótipo em Kaplay por uma simulação TypeScript, arena Canvas 2D e interface HTML/CSS. O histórico Git preserva os sistemas anteriores. `ORIGINAL_REQUEST.md` registra o pedido histórico do protótipo, não a especificação atual.
