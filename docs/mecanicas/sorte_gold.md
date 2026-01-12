# Sorte e Gold Drop

## Visão Geral
Inimigos dropam ouro em valores discretos (tiers) e a sorte do jogador influencia a probabilidade de cada tier. O visual do drop (cor e tamanho) também reflete seu valor.

## Tiers de Gold
- 1: comum — menor valor
- 2: incomum — valor moderado
- 5: raro — valor alto
- 10: épico — valor muito alto

## Visual
- Cor por tier (em `luck.ts`):
  - 1 → [255, 215, 0]
  - 2 → [255, 231, 76]
  - 5 → [255, 198, 0]
  - 10 → [255, 140, 0]
- Escala por tier: 1.0, 1.2, 1.4, 1.8

## Probabilidades e Sorte
- Pesos base: {1:60, 2:30, 5:8, 10:2}
- Ajuste por sorte (`luck` ∈ [0.5, 3.0]):
  - 1: peso reduzido por `1/L`
  - 2: multiplicado por `(0.8 + 0.2*L)`
  - 5: multiplicado por `(0.7 + 0.3*L)`
  - 10: multiplicado por `(0.5 + 0.5*L)`
- Seleção: roleta ponderada sobre soma dos pesos.

## Fluxo
1. `enemy.onDestroy`: calcula pesos por sorte, escolhe tier, cria drop.
2. Aplica cor e escala do tier.
3. `main.ts`: player colide com `gold-drop`, soma `drop.value` ao `gameState.gold`, atualiza UI.

## Referências de Código
- Tabela e utilitários: `src/state/luck.ts`
- Inimigos: `src/components/enemy.ts`
- Gold: `src/components/gold.ts`
- Coleta: `src/main.ts`
