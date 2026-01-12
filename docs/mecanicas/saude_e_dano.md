# Saúde e Dano

## Visão Geral
O jogador possui corações (HP) com um máximo configurável. Inimigos e projéteis inimigos causam dano ao colidir com o player. Existe um cooldown por inimigo para evitar dano contínuo por frame.

## Fluxo de Dano
1. Ao colidir `player` com `enemy`:
   - Verifica `enemy.lastDamageTime` vs `gameState.enemyDamageCooldownMs`.
   - Se liberado, aplica `dmg` (do preset do inimigo) ao `player.hp`.
2. Ao colidir `player` com `enemy-bullet`:
   - Destrói a bala e aplica 1 de dano.
3. Atualiza a UI de corações (`updateHearts`).
4. Se `hp <= 0`, executa kaboom e estado de morte simples.

## Health Máximo e Cura
- Upgrade `onHealth`: incrementa `maxHealth` e cura 1 imediatamente.
- `Quick Heal`: compra cura por 20 gold, apenas se `hp < maxHealth`.

## Cooldown por Inimigo
- `enemyDamageCooldownMs` define o tempo mínimo entre danos do mesmo inimigo.
- Esse tempo é verificado usando `Date.now()` e armazenado em `e.lastDamageTime`.

## Referências de Código
- Estado: `src/state/gameState.ts` – `maxHealth`, `enemyDamageCooldownMs`.
- Main: `src/main.ts` – handlers de colisão e atualização da UI.
- Loja: `src/components/shop.ts` – upgrades e quick heal.
- Player: `src/components/player.ts` – inicializa `hp`.
