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

## Referências de Código
- Estado: `src/state/gameState.ts` – `waves`, `xp`, `level`, `xpToLevel`.
- Waves: `src/state/waves.ts` – definição dos tipos e contagens.
- Main: `src/main.ts` – `spawnWave`, controle de término, XP e UI.
