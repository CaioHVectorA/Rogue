# Original User Request

## Initial Request — 2026-06-14T03:40:58Z

O projeto consiste em refinar e polir a UX do jogo, corrigir bugs críticos de crash e renderização, reestruturar e expandir o sistema de passivas para apoiar os arquétipos (Atirador, Conjurador e Colosso), otimizar o pacing e dinamismo do combate nas waves avançadas (Wave 9+), e implementar novos comportamentos de câmera e inimigos para enriquecer a experiência.

Working directory: /home/usuario/develop/rogue
Integrity mode: development

## Requirements

### R1. Correção de Bugs de Loja e Renderização
- Corrigir o crash de ReferenceError `countMaxedAttributes is not defined` no arquivo `shopPanel.ts` ao tentar comprar o nível 10 de atributos na loja (o método está definido em `shop.ts` mas não importado ou acessível em `shopPanel.ts`).
- Resolver o problema visual onde os painéis de aprimoramento de habilidades/cards transparecem ou sangram no centro da tela mesmo com a loja de atributos fechada.

### R2. Otimização do Ritmo e Pacing (Ondas 9+)
- Otimizar o ritmo do jogo a partir da Onda 9 para evitar monotonia. Implementar maior dinamismo e agilidade (movimentos mais rápidos do jogador, spawns coordenados, aceleração geral) para tornar as lutas mais frenéticas.
- Garantir que a habilidade ativa "Sobrecarga" (`attackBuff.ts`) aumente a velocidade do projétil (shoot speed) enquanto ativa.
- Conforme o tamanho do mapa se expande (`mapState`), aplicar zoom out proporcional suave da câmera (`k.camScale` reduzido) para que o jogador tenha visibilidade dos inimigos mais distantes.

### R3. Reformulação Completa das Passivas por Arquétipo
- Remover as antigas passivas "Ligeirinho" e "Reação em Cadeia".
- Garantir que todas as passivas na grade tenham emojis visuais exclusivos (evitar emojis duplicados).
- Implementar as seguintes Habilidades Passivas nos marcos dos níveis 5 e 10 de forma gratuita:
  - **Gerais / Híbridos:**
    - *Um, dois, três, quatro... CINCO!:* A cada 5 tiros básicos, o próximo é um "super tiro" que viaja a 2x de velocidade e causa impacto ampliado.
    - *Super Ímã:* Dobra o raio de coleta e aumenta a sorte do jogador em +0.3 permanentemente.
    - *Rastro Flamejante ou Venenoso:* Deixa um rastro nocivo no chão ao correr, queimando ou envenenando os inimigos que perseguem o jogador (o Game Designer deve definir o melhor tipo de rastro para a melhor UX).
  - **Atirador (Shooter):**
    - *Tiro Perfurante:* Tiros básicos atravessam 1 inimigo adicional.
    - *Disparo Duplo:* Dispara 2 projéteis por vez em um ângulo pequeno, com -15% de dano.
    - *Estação de Defesa:* Ficar parado por mais de 0.5s concede +35% de dano e +10% de resistência.
  - **Conjurador (Caster):**
    - *Eco Mágico:* Habilidades (Q) têm 20% de chance de serem conjuradas duas vezes seguidas sem custo de cooldown/carga.
    - *Arsenal Ampliado:* +1 Carga Máxima para habilidades com sistema de cargas (como minas).
    - *Luz Divina:* Invocações (orbes, totens) causam +30% de dano e duram +30% de tempo.
  - **Colosso (Juggernaut):**
    - *Onda de Choque:* Ao receber dano ou a cada 3s em combate, emite uma onda de choque que empurra e fere inimigos com base na Vida Máxima.
    - *Casca Grossa:* +1 de redução plana de dano (armadura) para cada 150 de Vida Máxima do jogador.
    - *Fúria Indomável:* Menor vida atual concede mais dano e velocidade de recarga (até +50%).

### R4. Novos Inimigos
- Criar pelo menos 2 novos tipos de inimigos com comportamentos únicos ou mecânicas mais "tanques" para diversificar os encontros.

## Acceptance Criteria

### Bugs e Correções
- [ ] O jogo não crasha ao tentar comprar o nível 10 de atributos na loja.
- [ ] Cartas de aprimoramento de habilidades não aparecem flutuando no meio do jogo se a loja de atributos estiver fechada.
- [ ] A câmera se afasta suavemente (zoom out) conforme o mapa cresce.

### Balanceamento e Passivas
- [ ] O combate a partir da Wave 9 é perceptivelmente mais rápido e emocionante.
- [ ] Ativar a habilidade "Sobrecarga" aumenta o dano de tiro, velocidade de recarga e velocidade do projétil.
- [ ] A grade 5x2 exibe todas as 12 passivas listadas nos milestones de nível 5 e 10 de forma gratuita.
- [ ] A passiva "Um, dois, três, quatro... CINCO!" atira um super tiro a cada 5 disparos.
- [ ] A passiva "Arsenal Ampliado" aumenta em +1 o máximo de cargas da habilidade Q equipada.
- [ ] Há pelo menos 2 novos tipos de inimigos no spawn das waves.

---
### CRITICAL NOTE ON COMMAND RUNNING:
Do NOT run any command to start the dev server (like npm run dev, vite, or bun run dev). The application is already running on port 3001, and launching another process will cause conflicts or be blocked. Simply edit the code files to implement the features. You may run npm run build or tsc to check for compilation/typing errors, but NEVER run dev servers.
