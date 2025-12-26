# 🗺️ Roadmap de Desenvolvimento — Roguelike (Kaplay.js)

> Objetivo: construir um roguelike **completo, simples e finalizável**, evitando overdesign e abandono.

---

## 🧱 FASE 0 — Setup básico
**Objetivo:** abrir o jogo e renderizar algo

- [X] Criar projeto Kaplay.js
- [X] Configurar loop principal
- [X] Criar cena principal
- [X] Renderizar player placeholder (quadrado ou círculo)

✅ **Resultado:** algo aparece na tela

---

## 🧪 FASE 1 — Movimento
**Objetivo:** controle básico divertido

- [X] Movimento WASD
- [X] Atributo de velocidade
- [X] Limites da arena
- [X] Debug visual (opcional)

✅ **Resultado:** movimentação fluida e responsiva

---

## 🎯 FASE 2 — Tiro parado (core mechanic)
**Objetivo:** estabelecer a identidade do jogo

- [X] Detectar se o player está parado
- [ ] Delay mínimo parado (ex: 0.2s)
- [ ] Implementar tiro básico
- [ ] Cooldown de tiro
- [ ] Cancelar tiro ao mover

✅ **Resultado:** mover → parar → atirar

---

## 👾 FASE 3 — Inimigo básico
**Objetivo:** combate funcional

- [ ] Inimigo segue o player
- [ ] Sistema de vida do inimigo
- [ ] Colisão tiro → inimigo
- [ ] Colisão inimigo → player
- [ ] Morte do player e restart

✅ **Resultado:** jogo jogável em loop simples

---

## 🌊 FASE 4 — Sistema de waves
**Objetivo:** criar o loop principal

- [ ] Timer de wave (45–60s)
- [ ] Spawner de inimigos
- [ ] Escala de dificuldade por wave
- [ ] Contador de waves

✅ **Resultado:** sobrevivência por ondas

---

## 💰 FASE 5 — Ouro e drops
**Objetivo:** recompensa clara ao jogador

- [ ] Inimigos dropam ouro
- [ ] Sistema de coleta (magnetismo opcional)
- [ ] UI simples mostrando ouro

✅ **Resultado:** matar → coletar → sentir progresso

---

## ⏸️ FASE 6 — Pausa entre waves + UI de atributos
**Objetivo:** progressão controlada

- [ ] Pausar jogo entre waves
- [ ] Criar UI de compra de atributos
- [ ] Implementar custo crescente
- [ ] Aplicar upgrades imediatamente

### Atributos iniciais:
- Ataque
- Velocidade
- Vida máxima
- Fire Rate
- Cooldown Reduction
- Skill Charge Speed
- Sorte

✅ **Resultado:** gastar ouro muda o gameplay

---

## ⭐ FASE 7 — XP e Skills
**Objetivo:** profundidade de builds

- [ ] XP dropa dos inimigos
- [ ] Barra de XP
- [ ] Skill de movimentação
- [ ] Skill de dano/controle
- [ ] Ultimate
- [ ] Sistema de cooldown visível

✅ **Resultado:** builds começam a surgir

---

## 🎲 FASE 8 — Sorte + Perks aleatórios
**Objetivo:** reforçar o roguelike

- [ ] Sorte afeta drops de ouro e XP
- [ ] Seleção de perks entre waves
- [ ] Perks econômicos
- [ ] Perks defensivos
- [ ] Perks ofensivos
- [ ] Tradeoffs simples

✅ **Resultado:** nenhuma run é igual

---

## ✨ FASE 9 — Polimento mínimo
**Objetivo:** fechar o jogo

- [ ] Feedback visual de dano
- [ ] Sons básicos
- [ ] Shake de câmera
- [ ] Tela de Game Over
- [ ] Restart rápido

✅ **Resultado:** jogo completo e apresentável

---

## 🧠 Regra de ouro (anti-abandono)

> ❗ **Nunca avance de fase se a atual não estiver jogável e divertida.**

---

## 📌 Observações finais
- Comece sempre com **placeholders**
- Visual bonito vem depois
- Cada fase deve gerar um **jogo jogável**, não apenas código

---
