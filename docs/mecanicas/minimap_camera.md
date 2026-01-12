# Minimap e Câmera

## Visão Geral
A câmera e o zoom variam conforme o estado do mapa (`mapState`) do player, permitindo diferentes escalas de visualização. Em um estado específico, a câmera segue o player constantemente.

## Zoom e Estados
- `mapState` é clamped entre 1 e 5.
- Escalas usadas:
  - 1 → 1.15
  - 2 → 1.0
  - 3 → 0.8
  - 4 → 0.72
  - 5 → 0.82 (e a câmera segue o player)

## Comportamento da Câmera
- No `createPlayer`, `k.camScale(vec2(camScaleVal))` ajusta o zoom.
- Em `update`, se `mapState === 5`, `k.camPos(this.pos)` segue o player.

## Minimap
- `src/components/minimap.ts` pode renderizar um minimapa com representação da arena e entidades.
- As paredes da arena (`arena-wall`) são definidas em `src/components/walls.ts`.

## Referências de Código
- Player: `src/components/player.ts` – controle de zoom e follow.
- Minimap: `src/components/minimap.ts` – renderização e lógica.
- Arena/Paredes: `src/components/walls.ts` – limites e colisões.
