# Movimento do Player

## Visão Geral
O player se desloca pela arena com uma velocidade base ajustável por upgrades. A direção vem dos inputs e é normalizada para evitar movimento mais rápido na diagonal.

## Inputs e Direção
- `movimentable.ts` calcula um vetor de direção (por exemplo, usando teclas WASD/Setas).
- A direção é normalizada e multiplicada pela velocidade atual.

## Componente Speed
- Armazena `speed` no objeto e expõe `setSpeed(v)` e `getSpeed()`.
- Permite que outros sistemas ajustem a velocidade sem recriar o objeto.

## Atualizações via Loja
- `onMoveSpeed` incrementa `gameState.moveSpeed` e aplica a `(player as any).speed`.
- UI é atualizada para refletir o novo valor.

## Referências de Código
- `src/components/movimentable.ts` – calcula direção e aplica movimento.
- `src/components/speed.ts` – componentiza a velocidade.
- `src/components/player.ts` – inicializa componentes.
- `src/components/shop.ts` – manipula upgrade e UI.
