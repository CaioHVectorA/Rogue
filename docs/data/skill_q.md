# ✨ Habilidades Q (Ofensivas)

Este documento descreve **exatamente como cada habilidade Q funciona dentro do jogo**, em termos práticos, visuais e técnicos. Ele deve permitir que alguém **implemente as habilidades sem precisar de contexto externo**.

⚠️ **Importante:**

* O sistema de **Ascensão faz parte do design**, porém **NÃO deve ser implementado agora**.
* As descrições de ascensão servem apenas como **direção futura**.
* O foco atual é **habilidade base + progressão por nível**.

---

## 📈 Progressão Geral das Skills Q

* O jogador escolhe **1 Skill Q no Level 2**
* A Skill Q pode ser evoluída até o **Nível 8**
* Evoluir a skill **não aumenta só dano**, mas altera comportamento

### Tipos de escala usados

* Aumentar quantidade de instâncias (projéteis, poças, hits)
* Aumentar área efetiva
* Reduzir intervalos internos (cooldowns invisíveis)
* Melhorar confiabilidade (ex: mais alvos)

---

## 🌱 Ascensão de Skill (SISTEMA FUTURO)

* Ascensão será feita via **Fragmentos Arcanos**, obtidos após X waves
* Não consome XP
* Será feita em **menu dedicado**

Formato futuro:

* Sempre **3 opções** por skill
* Uma opção mantém o comportamento original
* Outras duas **mudam o papel da skill**

⚠️ **Não implementar agora**

---

# 🔟 Skills Q — Especificação Técnica Completa

---

## 1️⃣ Shockwave

**Descrição funcional (sem nome):**
Ao efetuar um disparo estando completamente parado, o jogador emite uma onda de energia mágica à sua frente. Essa onda tem formato de arco e atravessa uma área frontal, empurrando inimigos para trás e causando dano ao contato.

**Comportamento em jogo:**

* A onda nasce no player e se expande rapidamente
* Inimigos atingidos são empurrados na direção oposta ao player
* O empurrão interrompe movimento inimigo

**Parâmetros base:**

* Ângulo do arco: 90°
* Alcance: médio
* Força de empurrão: média

**Escala por nível:**

* Aumenta o ângulo do arco
* Aumenta a força do empurrão

**Ascensão (futuro):**

* Remove dano e transforma em skill defensiva
* Aplica fogo nos inimigos empurrados
* Aumenta duração da onda

---

## 2️⃣ Ricochet

**Descrição funcional:**
Quando o projétil básico do jogador atinge um inimigo, ele automaticamente muda de direção e se lança contra outro inimigo próximo, priorizando o mais próximo dentro de um raio curto.

**Comportamento em jogo:**

* O ricochete é instantâneo
* O projétil não retorna ao player
* Não ricocheteia no mesmo inimigo duas vezes

**Parâmetros base:**

* Ricochetes máximos: 2
* Raio de busca: curto

**Escala por nível:**

* +1 ricochete a cada 2 níveis
* Aumenta raio de busca

**Ascensão (futuro):**

* Ricochetes infinitos com dano decrescente
* Ricochetes aplicam gimmicks

---

## 3️⃣ Cone Shot

**Descrição funcional:**
Ao disparar, o jogador emite múltiplos projéteis simultaneamente em formato de cone à frente. Cada projétil segue trajetória reta e independente.

**Comportamento em jogo:**

* Todos os projéteis nascem ao mesmo tempo
* O centro do cone segue a mira do player

**Parâmetros base:**

* Quantidade de projéteis: 5
* Ângulo total do cone: 40°

**Escala por nível:**

* Aumenta quantidade de projéteis
* Aumenta abertura do cone

**Ascensão (futuro):**

* Cone se fecha com distância
* Deixa rastro elemental

---

## 4️⃣ Chain Lightning

**Descrição funcional:**
Ao atingir um inimigo, o projétil libera um raio elétrico que salta automaticamente para inimigos próximos, causando dano elétrico a cada salto.

**Comportamento em jogo:**

* O raio prioriza inimigos não atingidos
* Salto é quase instantâneo

**Parâmetros base:**

* Saltos máximos: 3
* Distância máxima entre inimigos: curta

**Escala por nível:**

* +1 salto
* +distância de salto

**Ascensão (futuro):**

* Chance de stun
* Salto infinito

---

## 5️⃣ Arc Mine

**Descrição funcional:**
Ao atirar, o jogador lança minas mágicas no chão próximas à posição do impacto. Essas minas permanecem armadas até que um inimigo entre em seu raio, momento em que explodem.

**Comportamento em jogo:**

* Mina é um objeto físico no chão
* Explosão é circular

**Parâmetros base:**

* Quantidade: 2
* Raio da explosão: médio
* Tempo máximo no chão: 6s

**Escala por nível:**

* +quantidade
* +raio

**Ascensão (futuro):**

* Minas puxam inimigos
* Aplicam gimmicks

---

## 6️⃣ Poison Pool

**Descrição funcional:**
Ao disparar, o jogador cria **três poças de veneno** no chão. Cada poça possui **48x48 unidades de tamanho** e é criada próxima a inimigos aleatórios dentro de um alcance curto. Inimigos que permanecem sobre a poça recebem dano contínuo de veneno.

**Comportamento em jogo:**

* Poças não se movem
* Dano é aplicado por tick

**Visual:**

* Cor roxa
* Levemente transparente
* Efeito borbulhante constante

**Parâmetros base:**

* Quantidade: 3 poças
* Duração: 4 segundos

**Escala por nível:**

* Aumenta duração
* Aumenta stacks de veneno aplicados

**Ascensão (futuro):**

* Poças conectam entre si
* Explodem ao expirar

---

## 7️⃣ Boomerang Bolt

**Descrição funcional:**
O projétil disparado pelo jogador viaja até um alcance máximo e então retorna automaticamente ao player, causando dano tanto na ida quanto na volta.

**Comportamento em jogo:**

* O retorno ignora colisão com paredes
* Pode atingir o mesmo inimigo duas vezes

**Parâmetros base:**

* Alcance máximo: médio
* Velocidade: moderada

**Escala por nível:**

* +alcance
* +velocidade

**Ascensão (futuro):**

* Múltiplos retornos
* Explode ao retornar

---

## 8️⃣ Summoned Totem

**Descrição funcional:**
Ao atirar, o jogador invoca um totem mágico fixo no chão. O totem ataca automaticamente inimigos próximos disparando projéteis simples.

**Comportamento em jogo:**

* Totem é destrutível
* Prioriza inimigo mais próximo

**Parâmetros base:**

* Vida própria
* Duração limitada

**Escala por nível:**

* +vida
* +velocidade de disparo

**Ascensão (futuro):**

* Totem móvel
* Aplica gimmicks

---

## 9️⃣ Marked Shot

**Descrição funcional:**
Os disparos do jogador aplicam uma marca nos inimigos atingidos. Inimigos marcados recebem dano adicional de todas as fontes do player.

**Comportamento em jogo:**

* Marcas acumulam até um limite
* Marca tem duração

**Parâmetros base:**

* Máximo de marcas por inimigo
* Duração da marca

**Escala por nível:**

* +duração
* +dano por stack

**Ascensão (futuro):**

* Marca se propaga
* Marca explode

---

## 🔟 Orbital Orbs (Passiva + Ativa)

**Descrição funcional:**
Orbes mágicos orbitam constantemente o jogador, colidindo com inimigos e causando dano por impacto. Ao ativar a habilidade, os orbes aumentam drasticamente a velocidade de rotação por alguns segundos.

**Comportamento em jogo:**

* Orbes têm colisão física
* Ativação aumenta número de colisões

**Parâmetros base:**

* Quantidade de orbes: 2
* Raio da órbita: médio

**Escala por nível:**

* +orbes
* +velocidade de rotação

**Ascensão (futuro):**

* Orbes empurram inimigos
* Drenam vida

---

## 🎯 Buff de Ataque Básico

**Descrição funcional:**
Ao ativar, o jogador recebe um buff temporário que altera o comportamento do ataque básico, modificando dano, velocidade ou efeitos aplicados.

**Comportamento em jogo:**

* Buff tem duração fixa
* Visual claro no player

**Escala por nível:**

* +duração
* +potência do efeito

**Ascensão (futuro):**

* Parte do buff se torna passivo
* Aplica status adicional

---

## 📌 Princípios de Design

* Skills devem alterar **posicionamento ou timing**
* Clareza vi
