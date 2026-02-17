# Sistema de Perks – Resumo de Design

## Visão Geral

- **Perks por run:** 2
- Perks custam 5 de pontos de elevação cada, e podem ser adquiridas a partir do nível 3 livremente, até 2 perks no máximo.
- **Foco:** Ataque básico + Skill Q
- **Objetivo:** Builds agressivas, com risco, identidade forte e boa leitura no mobile
- **Princípios:**
  - Poucos perks, alto impacto
  - Trade-offs claros
  - Escala perigosa (ruim no início, forte no late)
  - Mobile-first (menos botões, mais passivos)

---

## Lista de Perks

### 1. Execução Limpa (Reset)

Matar um inimigo reduz o cooldown de **Q em 40%**.
Matar elites ou campeões reduz **100%** do cooldown.

---

### 2. Impacto Sísmico (Build Parruda)

Ataques à distância são substituídos por um **choque sísmico circular** ao redor do jogador.

- Dano escala com **Vida Máxima**
- Intervalo entre choques reduz conforme **Velocidade de Movimento**

Trade-offs:

- Alcance curto
- Alto risco contra inimigos ranged

---

### 3. Sede de Caça (Stack Infinito – Dano)

Cada inimigo morto concede **+1% de dano permanente**.
Ao morrer, perde **50%** dos bônus acumulados.

---

### 4. Engenharia Rúnica (Totens)

- **+1 Totem ativo**
- Totens herdam **30% do Dano de Tiro** e **Velocidade de Ataque** do jogador

---

### 5. Zona de Perigo (Agressão Próxima)

Para cada inimigo próximo:

- **+5% de dano causado**
- **+3% de dano recebido**

---

### 6. Aprendizado Doloroso (Stack Infinito – Vida)

Cada vez que recebe dano:

- **+0.5% de Vida Máxima permanente**

Receber dano consecutivo reduz a eficiência temporariamente.

---

### 7. Não Olhe Para Trás (Reset por Movimento)

Matar inimigos enquanto se move reduz o cooldown de **Q em 25%**.
Ficar parado por mais de 0.5s cancela o efeito.

---

### 8. Reação em Cadeia (Explosões)

Tiros têm **10% de chance** de causar uma explosão em área.

- Explosões causadas por explosões causam **50% menos dano**

---

## Perks de Ataque Básico

### 9. Ligeirinho

Ataques acertados concedem **+4% de Velocidade de Movimento** (até 5x).

- **10% da Velocidade bônus acelera a recarga de ataque**
- Errar um ataque reinicia os acúmulos

---

### 10. Diga Onde Você Vai, Que Vou Varando

Por **3s após usar Q**:

- Tiros **atravessam inimigos**
- Cada perfuração adicional causa **-20% de dano**

---

### 11. Ciclo Vicioso

Cada tiro reduz o cooldown restante de **Q em 20% do valor atual**.

- Reduções sucessivas têm eficiência reduzida por 0.3s

---

## Perks de Choque / Elétrico

### 12. Sobrecarga Elétrica

Inimigos com **Choque** recebem **+X% de dano** de todas as fontes.
Ao atingir **10 acúmulos de Choque**, o inimigo explode eletricamente.

---

## Regras de Balanceamento

- Máximo **1 perk de reset** por run
- Máximo **1 perk de stack infinito** por run
- Perks devem alterar **como** o jogador joga, não só números

---

## Direção Futura

- Ultimates automáticos (sem botão)
- Elementos (fogo/gelo) introduzidos primeiro como comportamento, depois como tema visual
- Perks exclusivos por skill

---

> Documento focado em manter o escopo controlado, identidade forte e boa jogabilidade em mobile.
