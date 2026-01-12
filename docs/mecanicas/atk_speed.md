# Attack Speed (Reload)

## Visão Geral
A taxa de ataque é determinada por um sistema de “carregamento” que acumula progresso até disparar um projétil. O parâmetro `reloadSpeed` é interpretado como tempo de recarga (em segundos). Diminuir esse tempo aumenta a taxa de tiro.

## Fluxo da Mecânica
1. Cada frame, o sistema calcula se o player está parado ou em movimento.
2. Converte o tempo de recarga em taxa: `base = 1 / reloadTime`.
3. Aplica penalidade se estiver em movimento: `rate = base * reloadMovePenalty`.
4. Incrementa `charge` por `dt * rate`.
5. Quando `charge >= chargeTime`, se parado, dispara e reseta o carregamento; se em movimento, mantém carregado mas não dispara.

## Matemática
- Tempo de recarga (`reloadTime`) menor ⇒ `1 / reloadTime` maior ⇒ `charge` acumula mais rápido ⇒ mais tiros por segundo.
- `reloadMovePenalty` ∈ (0,1] limita a taxa durante movimento. Ex.: 0.5 significa metade da taxa.
- `chargeTime` controla quanto de “barra de carregamento” é preciso para um disparo.

## Edge Cases e Salvaguardas
- `reloadTime` é limitado a um mínimo de 0.0001 para evitar divisão por zero.
- Visual de carregamento contorna o jogador e indica progresso com cor diferente se estiver se movendo.

## Upgrades
- Loja reduz multiplicativamente o `reloadTime` (`* 0.9`) com piso de `0.1s`, garantindo retornos decrescentes e estabilidade.

## Referências de Código
- Estado: `src/state/gameState.ts` – `reloadSpeed`, `reloadMovePenalty`.
- Tiro: `src/components/shoot.ts` – cálculo de `rate` e disparo.
- Loja: `src/components/shop.ts` – handler `onReload`.
