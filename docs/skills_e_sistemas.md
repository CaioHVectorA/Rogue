# 🎮 Documentação: Skills & Sistemas

> Documentação completa de todas as skills implementadas e sistemas do jogo.

---

## 📋 Índice

- [Sistemas Core](#sistemas-core)
  - [Registry de Skills](#registry-de-skills)
  - [Sistema de Veneno](#sistema-de-veneno)
  - [Sistema de Choque](#sistema-de-choque)
  - [Sistema de Buffs](#sistema-de-buffs)
  - [Sistema de Waves](#sistema-de-waves)
  - [Sistema de Luck & Gold](#sistema-de-luck--gold)
  - [Sistema de Upgrades](#sistema-de-upgrades)
  - [Sistema de Inimigos](#sistema-de-inimigos)
  - [Game State](#game-state)
- [Skills Implementadas](#skills-implementadas)
  - [Onda de Choque (shockwave)](#1-onda-de-choque-shockwave)
  - [Ricochete (ricochet-shot)](#2-ricochete-ricochet-shot)
  - [Tiro em Cone (cone-shot)](#3-tiro-em-cone-cone-shot)
  - [Corrente Elétrica (chain-lightning)](#4-corrente-elétrica-chain-lightning)
  - [Mina Terrestre (arc-mine)](#5-mina-terrestre-arc-mine)
  - [Poça Venenosa (poison-pool)](#6-poça-venenosa-poison-pool)
  - [Bumerangue (boomerang-bolt)](#7-bumerangue-boomerang-bolt)
  - [Totem Rúnico (summoned-totem)](#8-totem-rúnico-summoned-totem)
  - [Tiro Marcado (marked-shot)](#9-tiro-marcado-marked-shot)
  - [Orbitais (orbital-orbs)](#10-orbitais-orbital-orbs)
  - [Sobrecarga (attack-buff)](#11-sobrecarga-attack-buff)

---

## Sistemas Core

### Registry de Skills

**Arquivo:** `src/components/skills/registry.ts`

Sistema central de registro e gerenciamento de skills. Toda skill é registrada via `registerSkill()` e gerenciada por este módulo.

**Funcionalidades:**
- **Registro:** `registerSkill(skill)` — registra uma skill com `id`, `use()`, `getCooldown()`, etc.
- **Cargas:** Skills podem ter sistema de cargas (`getMaxCharges`). Ex: Mina Terrestre e Orbitais.
- **Regeneração de cargas:** `updateChargeRegen(skillId)` — regenera cargas com base no cooldown.
- **Verificação de uso:** `canUse(skillId)` — verifica cooldown ou cargas disponíveis.
- **Uso:** `useSkill(skillId, k, player)` — executa a skill e gerencia cooldown/cargas.
- **`canAlwaysUse`:** Permite usar mesmo em cooldown (ex: recall do bumerangue).
- **`addImpactFlash()`:** Helper visual para flash de impacto ao acertar inimigos.

**Tipos:**
```ts
type Skill = {
  id: string;
  use(ctx: SkillContext): void;
  getCooldown?(level: number): number;
  getMaxCharges?(level: number): number;
  canAlwaysUse?(): boolean;
};
```

---

### Sistema de Veneno

**Arquivo:** `src/components/skills/poison.ts`

Sistema **desacoplado** de veneno — pode ser usado por qualquer skill via `addPoisonStacks()`.

**Mecânicas:**
| Propriedade | Valor |
|---|---|
| Tick interval | 1.0s |
| Dano por stack por tick | 1 |
| Decay por tick | -1 stack |
| Stacking | ∞ (infinito) |
| Max bolhas visuais | 8 |

**Como funciona:**
1. Qualquer skill chama `addPoisonStacks(k, enemy, amount)`.
2. O sistema inicializa o tracking no inimigo (se ainda não tem).
3. A cada tick (1s), causa `stacks × 1` de dano.
4. Decai 1 stack por tick automaticamente.
5. Resetar o timer ao receber novos stacks garante que stacks novos não disparem dano imediatamente.

**Visuais:**
- Flash verde ao receber veneno.
- Bolhas verdes orbitando o inimigo (quantidade proporcional aos stacks, máx 8).
- Números de dano flutuantes verdes subindo.

**API pública:**
```ts
addPoisonStacks(k, enemy, stacks)  // Aplica stacks
getPoisonStacks(enemy)             // Consulta stacks atuais
```

---

### Sistema de Choque

**Arquivo:** `src/components/skills/shock.ts`

Sistema **desacoplado** de choque — pode ser usado por qualquer skill via `addShockStacks()`.

**Mecânicas:**
| Propriedade | Valor |
|---|---|
| Stacks para eletrocutar | 6 |
| Dano ao eletrocutar | 3 |
| Duração base do stun | 1.0s |
| Extra por stack acima de 6 | +0.1s por stack |
| Intensidade do shake | 3px |
| Velocidade do shake | 40 |
| Intervalo entre arcos visuais | 0.15s |

**Como funciona:**
1. Qualquer skill chama `addShockStacks(k, enemy, amount)`.
2. Stacks acumulam sem efeito até atingir o limiar (6).
3. Ao atingir 6+ stacks:
   - Causa **3 de dano** instantâneo.
   - Inimigo é **eletrocutado** (stunned): parado, shaking visual, arcos elétricos.
   - Duração do stun: `1.0s + 0.1s × (stacks - 6)`.
   - Stacks resetam para 0.
4. Receber stacks **durante** a eletrocução **aumenta** o tempo restante.
5. Ao terminar o stun, velocidade e cor do inimigo são restauradas.

**Callbacks de eletrocução:**
- `onElectrocution(k, callback)` — registra uma função chamada sempre que um inimigo é eletrocutado.
- Usado pela **Corrente Elétrica** para sua passiva de redução de cooldown.

**Visuais:**
- **Flash elétrico amarelo** ao receber stack (círculo expandindo).
- **Explosão de eletrocução:** anel expandindo + 8 faíscas radiais + label "⚡ SHOCK!" com punch-in.
- **Durante stun:** shake contínuo, flicker amarelo/branco, mini-arcos elétricos periódicos.
- **Contador de stacks** acima do inimigo: "⚡3" (cor intensifica conforme stacks).
- **Número de dano** flutuante "⚡3" ao eletrocutar.

**API pública:**
```ts
addShockStacks(k, enemy, stacks)   // Aplica stacks
getShockStacks(enemy)              // Consulta stacks atuais
onElectrocution(k, callback)       // Registra callback de eletrocução
```

---

### Sistema de Buffs

**Gerenciado em:** `src/state/gameState.ts` (campo `buffs`)

Multiplicadores temporários que afetam o player globalmente.

**Buffs disponíveis:**
| Buff | Tipo | Default |
|---|---|---|
| `damageMul` | Multiplicador de dano | 1.0 |
| `reloadSpeedMul` | Multiplicador de reload speed | 1.0 |
| `activeUntil` | Timestamp de expiração | 0 |
| `markedShot.active` | Se tiros marcam inimigos | false |
| `markedShot.activeUntil` | Timestamp de expiração da marcação | 0 |

---

### Sistema de Waves

**Arquivo:** `src/state/waves.ts`

Define as ondas de inimigos. Cada wave é um array de `{ type, count }`.

**Tipos de inimigos disponíveis:** `stone`, `red`, `blue`, `yellow`, `green`

**Exemplo:**
```ts
Wave 1: [{ type: "stone", count: 3 }, { type: "stone", count: 12 }]
Wave 2: [{ type: "red", count: 6 }, { type: "blue", count: 2 }]
Wave 3: [{ type: "green", count: 5 }]
```

---

### Sistema de Luck & Gold

**Arquivo:** `src/state/luck.ts`

Controla a tabela de drop de gold com tiers influenciados pela sorte do player.

**Tiers de Gold:**
| Tier | Peso base | Cor | Escala visual |
|---|---|---|---|
| 1 | 60 | Dourado padrão | 1.0x |
| 2 | 30 | Dourado claro | 1.2x |
| 5 | 8 | Dourado profundo | 1.4x |
| 10 | 2 | Laranja-dourado (raro) | 1.8x |

- Sorte (`luck`) afeta os pesos: mais sorte = mais chance de tiers altos.
- Luck é clamped entre 0.5 e 3.0.

---

### Sistema de Upgrades

**Arquivo:** `src/state/upgrades.ts`

Atributos melhoráveis do player:
- `moveSpeed` — Velocidade de movimento (+20 por nível)
- `maxHealth` — Vida máxima (+1 por nível)
- `reloadSpeed` — Velocidade de recarga (×0.9 multiplicativo por nível)
- `luck` — Sorte (afeta drops, +0.1 por nível)
- `projectileSpeed` — Velocidade dos projéteis (+40 por nível)
- `abilityHaste` — Aceleração de Habilidade (+5% por nível, reduz cooldowns)
- `chosenCount` — Contador de upgrades escolhidos (máx 3 atributos diferentes)

**Ability Haste:**
Cada nível de ability haste aplica uma redução percentual nos cooldowns de todas as skills.
- Fórmula: `cooldownEfetivo = cooldownBase × (1 - abilityHaste%)`
- O valor é cumulativo por nível: Lv1 = 5%, Lv2 = 10%, ..., Lv10 = 50%.
- Aplicado automaticamente no registry ao calcular cooldowns.

**Fórmula de custo:** `cost(n) = 5 + (n-1)² + n`

---

### Sistema de Inimigos

**Arquivo:** `src/components/enemies/types.ts` + `src/components/enemies/index.ts`

Todos os inimigos são criados via `commonEnemy()` que adiciona componentes padrão (movimento, colisão, vida, gold drop).

**Presets de inimigos:**
| Tipo | Nome | Tamanho | Velocidade | HP | Cor |
|---|---|---|---|---|---|
| `red` | REDUBIO | 28 | 120 | 3 | Vermelho |
| `blue` | barrublu | 40 | 80 | 6 | Azul |
| `yellow` | Amarilo | 28 | 150 | 3 | Amarelo |
| `green` | Verdu | 30 | 110 | 4 | Verde |
| `stone` | Pedrão | 44 | 35 | 20 | Marrom |

**Comportamento padrão:**
- Persegue o player continuamente.
- Respeita limites da arena.
- Dropa gold ao morrer.
- Suporta propriedades adicionais: `poisonStacks`, `marks`, `speed`, `defaultSpeed`.

---

### Game State

**Arquivo:** `src/state/gameState.ts`

Estado global centralizado do jogo.

**Atributos principais:**
| Campo | Default | Descrição |
|---|---|---|
| `moveSpeed` | 360 | Velocidade de movimento |
| `reloadSpeed` | 5 | Velocidade de recarga |
| `maxHealth` | 5 | Vida máxima |
| `projectileSpeed` | 560 | Velocidade dos projéteis |
| `abilityHaste` | 0.0 | Aceleração de habilidade (%) |
| `luck` | 1.0 | Sorte |
| `wave` | 1 | Wave atual |
| `gold` | 0 | Gold acumulado |
| `level` | 1 | Nível do player |
| `xp` / `xpToLevel` | 0 / 10 | XP atual e necessário (escala exponencial ×1.25) |

**Skills no state:**
- `skill1`, `skill2`, `ultimate` — Slots de skills equipadas
- `levels` — Nível de cada skill
- `cooldowns`, `lastUsedAt` — Tracking de cooldown
- `charges`, `maxCharges`, `chargeRegenTimers` — Sistema de cargas

---

## UI & HUD

### Barra de HP

**Arquivo:** `src/components/ui/topBar.ts`

Substituiu o sistema de corações por uma barra de vida moderna e numérica.

**Design:**
| Componente | Descrição |
|---|---|
| Fundo | Retângulo escuro (30, 30, 35) com outline e cantos arredondados |
| Preenchimento | Largura proporcional ao HP, cor dinâmica por % |
| Glow overlay | Faixa branca semi-transparente no topo (efeito de brilho) |
| Texto | "HP / MaxHP" centralizado na barra |
| Ícone | ❤ ao lado direito da barra |

**Cores dinâmicas:**
| HP % | Cor |
|---|---|
| > 60% | Verde (60, 220, 80) |
| 35% ~ 60% | Amarelo (240, 200, 40) |
| 15% ~ 35% | Laranja (240, 130, 30) |
| < 15% | Vermelho (220, 50, 50) |

**Feedback:** Flash vermelho no fundo ao receber dano (0.15s).

---

## Skills Implementadas

### 1. Onda de Choque (`shockwave`)

**Arquivo:** `src/components/skills/shockwave.ts`

| Propriedade | Valor |
|---|---|
| Cooldown | 3000ms - 150ms × level (mín 2000ms) |
| Dano | 2 (por inimigo, uma vez) |
| Raio | 80 + 10 × level |
| Knockback | 120 de força, 0.6s de duração |

**Mecânica:** Expande um anel circular do player que empurra e causa dano em inimigos. Cada inimigo só toma dano uma vez por onda. O knockback é um impulso único com decaimento suave.

**Visual:** Anel expandindo com borda branca sobre fundo escuro.

---

### 2. Ricochete (`ricochet-shot`)

**Arquivo:** `src/components/skills/ricochetShot.ts`

| Propriedade | Valor |
|---|---|
| Cooldown | 2200ms - 120ms × level (mín 1200ms) |
| Dano principal | 2 |
| Dano ricochete | 1 |
| Forks | 2 projéteis filhos |
| Velocidade | 1.5× projectileSpeed |

**Mecânica:** Lança um projétil azul no inimigo mais próximo. Ao acertar, cria 2 projéteis menores que buscam os inimigos mais próximos.

**Visual:** Quadrado azul com outline branco. Filhos menores e mais claros.

---

### 3. Tiro em Cone (`cone-shot`)

**Arquivo:** `src/components/skills/coneShot.ts`

| Propriedade | Valor |
|---|---|
| Cooldown | 1600ms - 100ms × level (mín 800ms) |
| Dano | 2 por projétil |
| Projéteis | 3 + floor(level / 2) |
| Arco | 60° |
| Velocidade | 0.9× projectileSpeed |

**Mecânica:** Dispara múltiplos projéteis em leque na direção do movimento do player (ou do inimigo mais próximo se parado). Mais projéteis com mais nível.

**Visual:** Quadrados laranjas com outline branco + flash de impacto.

---

### 4. Corrente Elétrica (`chain-lightning`)

**Arquivo:** `src/components/skills/chainLightning.ts`

**Tabela de escalamento por nível:**

| Nível | Dano | Raio | Max Targets | Shock (hit) | Shock (chain) | Cooldown | CD Redução/Eletrocução |
|---|---|---|---|---|---|---|---|
| 1 | 2 | 400 | 2 | 3 | 1 | 3000ms | 600ms |
| 2 | 2 | 450 | 3 | 4 | 2 | 2800ms | 800ms |
| 3 | 3 | 500 | 3 | 5 | 2 | 2600ms | 1000ms |
| 4 | 3 | 550 | 4 | 5 | 3 | 2400ms | 1000ms |
| 5 | 4 | 600 | 4 | 6 | 3 | 2200ms | 1000ms |

**Propriedades fixas:**
| Propriedade | Valor |
|---|---|
| Imunidade por hit | 5s |
| Velocidade projétil | 560 |
| Largura do raio visual | 4px |
| Duração do raio visual | 0.8s |

**Mecânica:** Dispara um projétil elétrico. Ao acertar, forma um **grafo de corrente**: o raio se propaga instantaneamente para vizinhos, que propagam para seus vizinhos com raio reduzido pela metade. Aplica **stacks de choque** (sistema desacoplado) — o hit inicial aplica mais stacks, e os chain hops aplicam progressivamente menos.

**Passiva — Condutor:** Cada inimigo eletrocutado (pelo sistema de choque) **reduz o cooldown** da Corrente Elétrica. A redução escala com nível (600ms~1000ms). Feedback visual: label "⚡-1s CD" flutuante azul acima do player.

**Visual:** Linhas amarelas com tremor elétrico (shake perpendicular), flash branco que decai para amarelo. Projétil retangular com glow elétrico.

---

### 5. Mina Terrestre (`arc-mine`)

**Arquivo:** `src/components/skills/arcMine.ts`

| Propriedade | Valor |
|---|---|
| Cooldown | 3000ms (regen de cargas) |
| Cargas | level + 1 (2 no lv1, 3 no lv2...) |
| Dano | 3 |
| Raio detecção | 60px |
| Raio explosão | 90px |
| Tempo de vida | 6s |

**Mecânica:** Coloca uma mina na posição do player. Quando um inimigo entra no raio de detecção, a mina entra em sequência: **azul → amarelo (200ms) → vermelho (200ms) → explosão**. Minas podem encadear explosões entre si!

**Fases visuais:**
1. `idle` — Círculo azul com glow pulsante, anel de alcance sutil, partículas de spawn
2. `warning` — Amarelo com shake, glow dourado, anel de range visível
3. `danger` — Vermelho com shake intenso, glow pulsando rápido
4. `exploding` — Explosão multi-camadas com efeitos especiais (ver abaixo)

**Visuais da explosão:**
- Flash branco central que decai para a cor da cadeia
- Anel de onda de choque expandindo (ease-out cúbico)
- Segundo anel mais lento com glow
- Partículas/faíscas voando radialmente com desaceleração
- Resíduo de glow no chão que desvanece

**Sistema de explosão em cadeia:**
- Quando uma mina explode e outra está no raio, a segunda encadeia
- **Linha de conexão** com shake elétrico liga as duas minas
- **Faísca viajante** percorre a linha de uma mina à outra
- **Cores escalam por profundidade:** azul → branco-azulado → dourado → laranja → vermelho-fogo
- **Label flutuante** "⚡ CHAIN x2!", "⚡ CHAIN x3!" etc. com punch-in animation
- Mais partículas e flash maior em explosões de cadeia

**Sistema de cargas:** Regenera uma carga a cada cooldown.

---

### 6. Poça Venenosa (`poison-pool`)

**Arquivo:** `src/components/skills/poisonPool.ts`

| Propriedade | Valor |
|---|---|
| Cooldown | 8000ms |
| Raio | 70px (circular 2D) |
| Duração | 10s + 3s × (level - 1) |
| Slow por level | 10%, 15%, 20%, 25%, 35% |
| Veneno | 1 stack a cada 0.8s |
| Spawn distance | 110px do player |

**Mecânica:** Lança uma única poça roxa grande na direção do inimigo mais próximo (ou para cima se não há inimigos). Inimigos dentro da poça recebem slow e acumulam stacks de veneno (via sistema desacoplado de veneno).

**Visual:**
- **Projétil:** Círculo roxo com arco parabólico + trail de partículas roxas
- **Cast:** Anel roxo expandindo do player
- **Poça:** Camadas circulares 2D:
  - Glow externo (pulsante, roxo escuro)
  - Poça principal (roxo médio, 45% opacidade)
  - Anel interno pulsante (roxo claro)
  - Segundo anel interno (lilás, pulsante)
  - Borda com outline roxo
  - Bolhas roxas subindo periodicamente
  - Partículas de impacto ao spawnar
- **Fade-in** em 0.4s, **fade-out** nos últimos 2s

**Usa o sistema de veneno** de `poison.ts` — cada tick dentro da poça aplica 1 stack.

---

### 7. Bumerangue (`boomerang-bolt`)

**Arquivo:** `src/components/skills/boomerangBolt.ts`

| Propriedade | Valor |
|---|---|
| Cooldown | 4000ms |
| Dano ida | 2 |
| Dano volta | 5 |
| Distância máx | 450px |
| Vel ida | 340 |
| Vel volta | 420 |
| Raio de catch | 24px |
| Redução de CD ao pegar | 50% |

**Mecânica:** Lança um projétil retangular amarelo na direção do movimento (ou do inimigo mais próximo). Ao atingir a distância máxima, retorna em linha reta para a **posição predita** do player (baseado no movimento atual). Se o player "apanhar" o bumerangue (ficar próximo), o cooldown é reduzido em 50%.

**Recall:** Usar a skill novamente enquanto o bumerangue está ativo força o retorno imediato.

**Visual:** Retângulo amarelo rotacionando continuamente (8 rot/s).

---

### 8. Totem Rúnico (`summoned-totem`)

**Arquivo:** `src/components/skills/summonedTotem.ts`

**Tabela de escalamento por nível:**

| Nível | HP | Duração | Tiros/s | Dano | Vel. Proj. | Alcance | Cooldown |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 6s | 1.2 | 1 | 380 | 350px | 14s |
| 2 | 5 | 8s | 1.6 | 1 | 400 | 400px | 13s |
| 3 | 6 | 10s | 2.0 | 2 | 420 | 450px | 12s |
| 4 | 7 | 12s | 2.8 | 2 | 440 | 500px | 11s |
| 5 | 8 | 15s | 3.5 | 2 | 460 | 550px | 10s |

**Mecânica:** Posiciona um totem perto do player (posição aleatória ±60px). O totem atira automaticamente no inimigo mais próximo dentro do alcance. Pode ser destruído por inimigos ou expira ao fim da duração.

**Visuais:**
- **Corpo:** Retângulo escuro (marrom escuro) com contorno dourado.
- **Chapéu rúnico:** Losango dourado no topo, rotacionado 45°.
- **Olho rúnico:** Quadrado dourado central pulsante com glow.
- **Glow pulsante:** Halo dourado atrás do corpo.
- **Barra de vida:** Verde (ou vermelha se HP < 35%), abaixo do corpo.
- **Barra de timer:** Dourada, mostra tempo restante, fica vermelha nos últimos 20%.
- **Anel de alcance:** Círculo sutil dourado mostrando o range.
- **Efeito de invocação:** Anel rúnico expansivo + flash branco + 8 partículas rúnicas subindo.
- **Disparo:** Muzzle flash dourado + projétil retangular com trail + glow pulsante.
- **Hit:** Faíscas douradas ao acertar inimigo.
- **Últimos 2s:** Shake de urgência + contorno piscando vermelho/dourado + fade-out gradual.
- **Destruição:** 12 fragmentos com gravidade (dourados e escuros) + flash expansivo + label "💥".
- **Dano recebido:** Flash vermelho momentâneo no corpo e runa.

---

### 9. Tiro Marcado (`marked-shot`)

**Arquivo:** `src/components/skills/markedShot.ts`

| Propriedade | Valor |
|---|---|
| Cooldown | 10000ms |
| Marcas para explodir | 5 (4 no lv4+) |
| Dano explosão | 3 + 1 × (level - 1) |
| Raio explosão | 150 + 15 × (level - 1) |
| Duração do buff | 8s + 1s × (level - 1) |
| Marcas da explosão | 2 (3 no lv4+) |

**Mecânica:** Ativa um buff que faz tiros normais marcarem inimigos. Ao acumular 5 marcas (4 no lv4+), o inimigo explode em área, causando dano e aplicando 2 marcas (3 no lv4+) nos inimigos atingidos — permitindo **explosões em cadeia**!

**Visual:**
- Player fica rosa/vermelho durante o buff
- Flash rosa ao marcar inimigos
- Anel rosa expandindo na explosão
- Flash de impacto nos atingidos

---

## 🗂 Estrutura de Arquivos

```
src/
├── state/
│   ├── gameState.ts      # Estado global centralizado
│   ├── debug.ts          # Configurações de debug/teste
│   ├── skillData.ts      # Metadados das skills (nome, desc, cooldown)
│   ├── upgrades.ts       # Sistema de upgrades
│   ├── luck.ts           # Sistema de sorte e drops de gold
│   └── waves.ts          # Definição das ondas de inimigos
├── components/
│   ├── skills/
│   │   ├── registry.ts        # Registry central + helpers
│   │   ├── poison.ts          # Sistema de veneno desacoplado
│   │   ├── shock.ts           # Sistema de choque desacoplado
│   │   ├── arcMine.ts         # Mina Terrestre
│   │   ├── attackBuff.ts      # Sobrecarga
│   │   ├── boomerangBolt.ts   # Bumerangue
│   │   ├── chainLightning.ts  # Corrente Elétrica
│   │   ├── coneShot.ts        # Tiro em Cone
│   │   ├── markedShot.ts      # Tiro Marcado
│   │   ├── orbitalOrbs.ts     # Orbitais
│   │   ├── poisonPool.ts      # Poça Venenosa
│   │   ├── ricochetShot.ts    # Ricochete
│   │   ├── shockwave.ts       # Onda de Choque
│   │   └── summonedTotem.ts   # Totem Rúnico
│   └── enemies/
│       ├── index.ts           # Presets e spawners
│       └── types.ts           # Factory base (commonEnemy)
```

---

## 🔧 Debug

**Arquivo:** `src/state/debug.ts`

Permite configurar o estado inicial para testes rápidos:

```ts
export const debug = {
  INITIAL_GOLD: 1000,
  INITIAL_WAVE: 1,
  INITIAL_LEVEL: 3,
  INITIAL_XP: 9,
  INITIAL_SKILL1: "poison-pool",   // skill equipada no slot 1
  INITIAL_SKILL1_LEVEL: 5,         // nível da skill
};
```

Altere `INITIAL_SKILL1` para o id de qualquer skill para testá-la rapidamente.
