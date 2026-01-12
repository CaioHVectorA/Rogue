# Projectile Speed

## Visão Geral
Controla quão rápido os projéteis se deslocam. Velocidade maior aumenta a responsividade do ataque e a taxa de acerto em inimigos móveis.

## Comportamento
- A velocidade é aplicada como multiplicador do vetor de direção do projétil.
- Projetis são destruídos ao colidir com inimigos ou paredes, ou ao se afastar demais da área ativa.

## Upgrades e Aplicação
- A loja incrementa `projectileSpeed` em `+40` por compra.
- O `shoot` lê o valor atual no momento do disparo (não cacheado), refletindo upgrades imediatamente após a compra.

## Impactos de Design
- Velocidade alta reduz tempo de reação necessário; balancear com `reloadSpeed` e dano.
- Pode atravessar distâncias maiores antes de serem destruídos (dependendo da regra de remoção).

## Referências de Código
- Estado: `src/state/gameState.ts` – `projectileSpeed`.
- Tiro: `src/components/shoot.ts` – usa `dir.scale(speed)` ao criar projétil.
- Player: `src/components/player.ts` – não fixa velocidade; delega ao estado.
- Loja: `src/components/shop.ts` – handler `onProjectile`.
