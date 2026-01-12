# Loja (Upgrades)

## Visão Geral
A loja permite evoluir atributos do jogador entre waves usando Gold. Há limitações de escolhas iniciais, progressão por níveis (até 10) e custos crescentes. As mudanças são aplicadas imediatamente no estado do jogo e refletidas na UI.

## Fluxo da Mecânica
1. Jogador coleta Gold ao matar inimigos (drops em `enemy.ts` e coleta em `main.ts`).
2. Ao abrir a loja (UI visível entre waves), o jogador clica nos botões de upgrade.
3. Cada clique chama um handler que valida se pode comprar, cobra o custo e aplica o efeito.
4. Os valores atualizados são refletidos em tempo real no `gameState` e na UI.

## Limites e Escolhas
- Cada atributo pode ter até nível 10.
- O jogador só pode “escolher” até 3 linhas de upgrade diferentes. A primeira compra de um atributo conta como uma escolha.
- A partir daí, o jogador pode continuar evoluindo os atributos já escolhidos até o limite.

## Fórmula de Custo
A função de custo por nível é:
```
costForLevel(n) = 5 + (n - 1)^2 + n
```
- `n` é o nível que você pretende comprar (por exemplo, se você está no nível 2 e quer ir para o 3, n=3).
- O custo cresce quadraticamente, garantindo progressão e decisões.

## Efeitos dos Upgrades
- Move Speed: aumenta a velocidade de movimento do player.
  - Efeito imediato: `(player as any).speed = gameState.moveSpeed`.
- Max Health: aumenta o máximo de corações e cura 1 ao comprar (sem ultrapassar o máximo).
  - Efeito imediato: `(player as any).hp = Math.min(player.hp + 1, gameState.maxHealth)`.
- Reload Speed: reduz o tempo de recarga (interpretação como tempo em segundos), aumentando a taxa de tiro.
  - Redução multiplicativa: `reloadSpeed *= 0.9` com piso de `0.1s`.
  - A taxa de carregamento usada no tiro é `1 / reloadTime`.
- Luck (Sorte): aumenta probabilidades de drops de Gold mais valiosos (tiers 1, 2, 5, 10).
  - A sorte influencia pesos através de `src/state/luck.ts`.
- Projectile Speed: aumenta a velocidade das balas do player.
  - O valor é lido no momento do disparo para refletir upgrades imediatamente.

## Integração com a UI
- `ui.setUpgradeHandlers(...)` conecta os botões de upgrade aos handlers.
- Após cada compra, a UI é atualizada:
  - `ui.updateGold(gameState.gold)`
  - `ui.refreshShopStats({ ... })`: reflete valores na vitrine da loja.
- A UI de hearts é atualizada ao comprar saúde ou usar Quick Heal.

## Quick Heal
- Compra de cura rápida custa 20 Gold.
- Só cura se o HP atual for menor que `maxHealth`.
- Atualiza estados e UI (`updateHearts`, `updateGold`, `refreshShopStats`).

## Referências de Código
- Arquivo principal da loja: `src/components/shop.ts`
  - Funções principais:
    - `costForLevel(n)` – cálculo de custo.
    - `canUpgrade(key)` – validações: nível, escolha inicial, custo disponível.
    - `spendAndLevel(key)` – realiza a compra: incrementa nível, desconta Gold, atualiza contagem de escolhas e UI.
  - Handlers:
    - `onMoveSpeed` – aplica velocidade de movimento ao `player` e atualiza vitrine.
    - `onHealth` – incrementa `maxHealth`, cura 1 e atualiza UI.
    - `onReload` – reduz tempo de recarga multiplicativamente e atualiza UI.
    - `onLuck` – incrementa sorte e atualiza UI.
    - `onProjectile` – incrementa velocidade de projétil e atualiza UI.
- Estado global: `src/state/gameState.ts`
  - Contém `moveSpeed`, `reloadSpeed`, `projectileSpeed`, `maxHealth`, `gold`, além de `upgrades`.
- Estrutura de upgrades: `src/state/upgrades.ts`
  - Armazena níveis de cada atributo e `chosenCount`.
- UI: `src/components/ui.ts`
  - Deve expor `setUpgradeHandlers`, `updateGold`, `updateHearts`, `refreshShopStats`, `setPlayVisible`, `updateWave`, etc.

## Interações com Outras Mecânicas
- Attack Speed (Reload): `src/components/shoot.ts` converte `reloadSpeed` (tempo) em taxa, respeitando a penalidade de movimento.
- Projectile Speed: `src/components/shoot.ts` lê `gameState.projectileSpeed` no momento do disparo; `player.ts` não fixa esse valor.
- Gold e Sorte: `src/components/enemy.ts` usa `luck.ts` para definir tier do drop; `main.ts` coleta e atualiza Gold e UI.

## Boas Práticas e Extensões
- Evite hardcode de valores no `player` para que upgrades globais reflitam de imediato.
- Para novos atributos (ex.: dano do projétil), siga o mesmo padrão:
  - Adicione ao `upgrades.ts` e `gameState.ts`.
  - Crie handler de compra em `shop.ts`.
  - Consuma o estado na mecânica correspondente (ex.: `shoot.ts`).
- Persistência (opcional): adicione salvamento/recuperação do `gameState` (LocalStorage) entre sessões.
