# Waves e XP

## Visão Geral
O jogo progride por waves. Cada wave define tipos e quantidades de inimigos. Matar inimigos concede XP; ao atingir o limite (`xpToLevel`), o player sobe de nível e o próximo limite aumenta.

## Fluxo de Waves
1. Botão Play inicia a wave atual (`ui.onPlayClick`).
2. `spawnWave(waveIndex)` lê a definição em `gameState.waves[waveIndex - 1]`.
3. Para cada entrada `type`/`count`, instancia inimigos com arena e alvo `player`.
4. Contabiliza `enemiesLeft` e decrementa no `enemy.onDestroy`.
5. Quando `enemiesLeft <= 0`, avança `gameState.wave`, atualiza UI e reexibe o botão Play.

## XP e Level
- Ao destruir inimigo, concede `+1 XP`.
- Se `xp >= xpToLevel`:
  - `xp -= xpToLevel`
  - `level += 1`
  - `xpToLevel = floor(xpToLevel * 1.3)`

## Progressão de XP por nível

A quantidade de XP necessária para subir de nível cresce de forma exponencial:

- Fórmula: `XP(level) = base * factor^(level - 1)`
- Parâmetros atuais:
  - `base = 10` (XP para o nível 1)
  - `factor = 1.25` (aumento de 25% por nível)

Exemplos:
- Nível 1 → 10 XP
- Nível 2 → 12
- Nível 3 → 15
- Nível 4 → 19
- Nível 5 → 24

Implementação:
- Função `xpRequiredFor(level)` em `src/state/gameState.ts` calcula o XP alvo.
- `gameState.xpToLevel` é inicializado com `xpRequiredFor(INITIAL_LEVEL)`.
- Ao mudar de nível, chame `recalcXpToLevel()` para atualizar `xpToLevel`.

Ajustes:
- Para tornar a curva mais suave ou mais rápida, altere `base` e/ou `factor`.

## Referências de Código
- Estado: `src/state/gameState.ts` – `waves`, `xp`, `level`, `xpToLevel`.
- Waves: `src/state/waves.ts` – definição dos tipos e contagens.
- Main: `src/main.ts` – `spawnWave`, controle de término, XP e UI.
