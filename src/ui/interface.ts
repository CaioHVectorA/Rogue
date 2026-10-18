import type { Game } from "../game/engine";
import { ACTS, CLASSES, REWARDS, TOTAL_ROOMS, formatTime } from "../game/model";
import type { ClassId } from "../game/model";
import { icon } from "./icons";
import type { DeviceLayout } from "./device";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export const freshSeed = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) =>
    n.toString(16).padStart(2, "0"),
  )
    .join("")
    .toUpperCase();
export class Interface {
  selected: ClassId = "ranger";
  seed = freshSeed();
  help = false;
  confirmAbandon = false;
  private previousPhase = "";
  private hud: HTMLElement;
  private overlay: HTMLElement;
  constructor(
    private root: HTMLElement,
    private game: Game,
    private layout: DeviceLayout,
  ) {
    root.innerHTML = `
      <header class="masthead"><a class="brand" href="#" aria-label="Rogue — início">${icon("mark")}ROGUE<span>RUN / REPEAT / RISE</span></a>
      <div class="header-actions"><span class="edition">UM ROGUELITE DE RITMO & ESCOLHAS</span><label class="layout-switch"><span class="sr-only">Interface</span><select aria-label="Interface"><option value="auto">Auto</option><option value="mobile">Celular</option><option value="desktop">Desktop</option></select></label><button class="icon-button" data-action="sound" aria-label="Alternar som"></button><button class="icon-button" data-action="help" aria-label="Como jogar">${icon("book")}</button></div></header>
      <section class="hud" aria-label="Estado da run" hidden></section>
      <div class="overlay"></div>
      <div class="touch-controls" hidden><div class="movement-control"><div class="joystick" aria-label="Arraste para mover"><span></span></div><span class="stick-hint">SOLTE PARA ATIRAR</span></div><div class="touch-actions"><button data-action="dash" aria-label="Esquivar">${icon("arrow")}<span>Esquiva</span><small data-touch-cooldown="dash">Pronta</small></button><button data-action="skill" aria-label="Usar habilidade">${icon("bolt")}<span>Habilidade</span><small data-touch-cooldown="skill">Pronta</small></button></div></div>
      <footer class="page-footer"><span>UM PASSO PARA SOBREVIVER. UMA PAUSA PARA LUTAR.</span><span class="footer-status"><i></i> EXPEDIÇÃO AO NÚCLEO</span></footer>`;
    this.hud = root.querySelector(".hud")!;
    this.overlay = root.querySelector(".overlay")!;
    root.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-action]",
      );
      // Touch actions run on pointerdown; suppress the synthetic click on release.
      if (button?.closest(".touch-actions")) return;
      if (button && !(button as HTMLButtonElement).disabled)
        this.action(button.dataset.action!, button.dataset.value);
    });
    root.querySelector("select")!.addEventListener("change", (event) => {
      this.layout.setPreference((event.target as HTMLSelectElement).value);
    });
    root.querySelector(".brand")!.addEventListener("click", (event) => {
      event.preventDefault();
      if (game.phase === "combat") game.pause();
      else if (game.phase === "result") game.menu();
    });
    root.addEventListener("input", (event) => {
      if ((event.target as HTMLElement).id === "seed")
        this.seed = (event.target as HTMLInputElement).value;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (this.help) {
          this.help = false;
          this.render();
        } else game.pause();
      }
      if (
        event.key === "Tab" &&
        this.overlay.querySelector('[role="dialog"]')
      ) {
        const focusable = Array.from(
          this.overlay.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, [tabindex="0"]',
          ),
        );
        const first = focusable[0],
          last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    game.onChange = () => this.render();
    this.render();
  }
  private action(action: string, value?: string) {
    const g = this.game;
    switch (action) {
      case "class":
        this.selected = value as ClassId;
        this.render();
        break;
      case "start":
        g.start(this.selected, this.seed.trim() || freshSeed());
        break;
      case "daily":
        this.seed = `DIARIA-${new Date().toISOString().slice(0, 10)}`;
        this.render();
        break;
      case "random":
        this.seed = freshSeed();
        this.render();
        break;
      case "sound":
        g.toggleMute();
        break;
      case "help":
        if (g.phase === "combat") g.pause();
        this.help = true;
        this.render();
        break;
      case "close-help":
        this.help = false;
        this.render();
        break;
      case "pause":
        g.pause();
        break;
      case "reward":
        g.chooseReward(value!);
        break;
      case "reroll":
        g.reroll();
        break;
      case "heal":
        g.buy("heal");
        break;
      case "forge":
        g.buy("forge");
        break;
      case "next":
        g.nextRoom();
        break;
      case "retry":
        g.start(g.run.classId, g.run.seed);
        break;
      case "menu":
        this.seed = freshSeed();
        g.menu();
        break;
      case "abandon":
        if (this.confirmAbandon) {
          this.confirmAbandon = false;
          g.abandon();
        } else {
          this.confirmAbandon = true;
          this.render();
        }
        break;
      case "skill":
        g.skill();
        break;
      case "dash":
        g.dash();
        break;
    }
  }
  render() {
    const g = this.game;
    document.documentElement.dataset.phase = g.phase;
    this.root.querySelector<HTMLSelectElement>("select")!.value =
      this.layout.preference;
    if (this.previousPhase !== g.phase) this.confirmAbandon = false;
    const sound = this.root.querySelector<HTMLButtonElement>(
      '[data-action="sound"]',
    )!;
    sound.innerHTML = icon(g.muted ? "mute" : "sound");
    sound.setAttribute("aria-label", g.muted ? "Ativar som" : "Silenciar som");
    sound.setAttribute("aria-pressed", String(!g.muted));
    const active = g.phase !== "menu";
    this.hud.hidden = !active;
    this.root.querySelector<HTMLElement>(".touch-controls")!.hidden =
      g.phase !== "combat" || this.layout.mode !== "mobile";
    this.root.dataset.phase = g.phase;
    if (active) this.renderHud();
    const previousFocus = (document.activeElement as HTMLElement)?.dataset
      .action;
    const previousValue = (document.activeElement as HTMLElement)?.dataset
      .value;
    this.overlay.classList.toggle(
      "is-gameplay",
      g.phase === "combat" && !this.help,
    );
    this.overlay.innerHTML = this.help ? this.helpScreen() : this.screen();
    const modal = !!this.overlay.querySelector('[role="dialog"]');
    this.root.querySelector<HTMLElement>(".masthead")!.inert = modal;
    this.hud.inert = modal;
    const seedInput = this.overlay.querySelector<HTMLInputElement>("#seed");
    if (seedInput) seedInput.value = this.seed;
    if (this.previousPhase !== g.phase || this.help) {
      this.overlay.scrollTop = 0;
      if (g.phase !== "menu")
        requestAnimationFrame(() => {
          const target =
            this.overlay.querySelector<HTMLElement>("[autofocus]") ??
            this.overlay.querySelector<HTMLElement>(".primary") ??
            this.overlay.querySelector<HTMLElement>("button");
          target?.focus({ preventScroll: true });
        });
    } else if (previousFocus) {
      const targets = Array.from(
        this.overlay.querySelectorAll<HTMLElement>(
          `[data-action="${previousFocus}"]`,
        ),
      );
      (
        targets.find((el) => el.dataset.value === previousValue) ?? targets[0]
      )?.focus({ preventScroll: true });
    }
    this.previousPhase = g.phase;
    this.tick();
  }
  private renderHud() {
    const g = this.game;
    if (this.layout.mode === "mobile") {
      this.hud.innerHTML = `<div class="mobile-hud"><div class="mobile-progress"><span class="eyebrow">ATO ${g.run.act} · ${g.run.room % 4 === 0 ? "GUARDIÃO" : `ENCONTRO ${g.run.room}/12`}</span><span id="time-value"></span><button class="icon-button" data-action="pause" aria-label="Pausar jogo">${icon("pause")}</button></div><div class="mobile-status"><div class="vitals"><div class="vital-label">${icon("heart")}<strong id="hp-value"></strong></div><div class="meter"><i id="hp-meter"></i></div></div><span class="mobile-gold">${icon("coin")}<b id="gold-value"></b></span><span id="reload-state">${icon("target")}<span id="combat-hint"></span></span></div></div><div class="boss-health" id="boss-health" hidden><div><span>${ACTS[g.run.act - 1].boss}</span><small id="boss-phase"></small></div><div class="meter"><i id="boss-meter"></i></div></div>`;
      return;
    }
    this.hud.innerHTML = `<div class="hud-top"><div class="vitals"><div class="vital-label">${icon("heart")}<span>INTEGRIDADE</span><strong id="hp-value"></strong></div><div class="meter"><i id="hp-meter"></i></div></div>
      <div class="route-mini">${Array.from({ length: TOTAL_ROOMS }, (_, i) => `<span class="${i + 1 < g.run.room ? "complete" : i + 1 === g.run.room ? "current" : ""} ${(i + 1) % 4 === 0 ? "boss-node" : ""}" title="Encontro ${i + 1}">${(i + 1) % 4 === 0 ? icon("crown") : ""}</span>`).join("")}</div>
      <div class="run-counters"><span>${icon("coin")}<b id="gold-value"></b></span><span id="time-value"></span><button class="icon-button" data-action="pause" aria-label="Pausar jogo">${icon("pause")}</button></div></div>
      <div class="boss-health" id="boss-health" hidden><div><span>${ACTS[g.run.act - 1].boss}</span><small id="boss-phase">GUARDIÃO DO ATO ${g.run.act}</small></div><div class="meter"><i id="boss-meter"></i></div></div>
      <div class="hud-bottom"><div class="encounter-label"><span class="eyebrow">ATO ${String(g.run.act).padStart(2, "0")} / ${ACTS[g.run.act - 1].name.toUpperCase()}</span><strong>Encontro ${String(g.run.room).padStart(2, "0")}<small> / 12</small></strong><span id="combat-hint"></span></div>
      <div class="abilities"><div class="ability"><kbd>ESPAÇO</kbd><div><strong>Esquiva</strong><span id="dash-value"></span></div></div><div class="ability"><kbd>Q</kbd><div><strong>${CLASSES[g.run.classId].skill}</strong><span id="skill-value"></span></div></div><div class="reload-ring" id="reload-state">${icon("target")}<span>Pare para atirar</span></div></div></div>`;
  }
  tick() {
    const g = this.game;
    if (g.phase === "menu") return;
    const text = (id: string, value: string) => {
      const el = this.hud.querySelector<HTMLElement>(`#${id}`);
      if (el && el.textContent !== value) el.textContent = value;
    };
    text("hp-value", `${Math.ceil(g.player.hp)} / ${g.player.maxHp}`);
    text("gold-value", String(g.run.gold));
    text("time-value", formatTime(g.run.elapsed));
    text(
      "dash-value",
      g.player.dashCd > 0 ? `${g.player.dashCd.toFixed(1)}s` : "Pronta",
    );
    text(
      "skill-value",
      g.player.skillCd > 0 ? `${g.player.skillCd.toFixed(1)}s` : "Pronta",
    );
    text(
      "combat-hint",
      g.phase === "combat"
        ? `${g.enemies.length + g.spawnQueue.length} ameaças restantes`
        : "O tempo da run está parado",
    );
    for (const action of ["dash", "skill"] as const) {
      const cooldown = action === "dash" ? g.player.dashCd : g.player.skillCd;
      const button = this.root.querySelector<HTMLButtonElement>(
        `.touch-actions [data-action="${action}"]`,
      )!;
      button.disabled = cooldown > 0 || g.intro > 0 || g.phase !== "combat";
      const label = button.querySelector("small")!;
      label.textContent = cooldown > 0 ? `${cooldown.toFixed(1)}s` : "Pronta";
      button.classList.toggle("available", !button.disabled);
    }
    this.hud.querySelector<HTMLElement>("#hp-meter")!.style.width =
      `${Math.max(0, g.player.hp / g.player.maxHp) * 100}%`;
    this.hud
      .querySelector<HTMLElement>("#reload-state")!
      .classList.toggle("ready", g.player.charge >= g.player.reload);
    const boss = g.enemies.find((e) => e.kind === "boss");
    this.hud.querySelector<HTMLElement>("#boss-health")!.hidden = !boss;
    if (boss) {
      this.hud.querySelector<HTMLElement>("#boss-meter")!.style.width =
        `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
      text(
        "boss-phase",
        boss.enraged
          ? "FASE II · PRESSÃO CRESCENTE"
          : `GUARDIÃO DO ATO ${g.run.act}`,
      );
    }
  }
  private screen(): string {
    const g = this.game;
    switch (g.phase) {
      case "menu":
        return this.layout.mode === "mobile"
          ? this.mobileMenuScreen()
          : this.menuScreen();
      case "combat":
        return "";
      case "reward":
        return this.rewardScreen();
      case "camp":
        return this.campScreen();
      case "paused":
        return this.dialog(
          `<div class="emblem">${icon("pause")}</div><span class="eyebrow">RESPIRE. A RUN PODE ESPERAR.</span><h1>Uma breve <em>pausa.</em></h1><p>Encontre seu ritmo. O núcleo ainda está lá.</p><div class="stack-actions"><button class="primary" data-action="pause">Continuar a run ${icon("arrow")}</button><button class="secondary" data-action="help">Controles e regras ${icon("book")}</button><button class="text-button danger" data-action="abandon">${this.confirmAbandon ? "Confirmar encerramento desta run" : "Encerrar esta run"}</button></div>`,
        );
      case "result":
        return this.resultScreen();
    }
  }
  private mobileMenuScreen() {
    const stats = CLASSES[this.selected],
      g = this.game;
    return `<main class="mobile-menu"><section class="mobile-welcome"><span class="eyebrow">UMA VIDA. TRÊS GUARDIÕES.</span><h1>Encontre seu <em>ritmo.</em></h1><p>Mova para escapar. Solte para disparar.</p><div class="mobile-record"><span>${icon("crown")} ${g.records.wins} vitórias</span><span>Melhor ${g.records.bestRoom}/12</span><button class="text-button" data-action="help">Como jogar ${icon("arrow")}</button></div></section><section class="mobile-loadout panel"><div class="panel-heading"><span class="eyebrow">ESCOLHA SEU CAMINHO</span><span class="small-index">01—03</span></div><div class="mobile-class-list" role="group" aria-label="Caminho inicial">${(Object.keys(CLASSES) as ClassId[]).map((id, index) => `<button class="mobile-class ${id === this.selected ? "selected" : ""}" style="--class-color:${CLASSES[id].color}" data-action="class" data-value="${id}" aria-pressed="${id === this.selected}">${icon(["target", "bolt", "shield"][index])}<strong>${CLASSES[id].name}</strong><small>${CLASSES[id].hp} vida</small></button>`).join("")}</div><div class="mobile-skill" style="--class-color:${stats.color}"><span class="eyebrow">${stats.skill.toUpperCase()}</span><p>${stats.desc.replace("Q ", "Toque em Habilidade: ")}</p></div><details class="mobile-seed"><summary>Código da run e desafio diário</summary><div class="seed-row"><label for="seed">CÓDIGO DA RUN<input id="seed" maxlength="40" autocomplete="off" spellcheck="false" aria-describedby="seed-help"></label><button class="icon-button" data-action="random" aria-label="Gerar novo código">${icon("repeat")}</button><button class="text-button" data-action="daily">Diária UTC</button></div><p id="seed-help" class="seed-note">Mesmo código e escolhas, mesmas ofertas.</p></details></section><div class="mobile-start"><button class="primary start-button" data-action="start">Iniciar expedição ${icon("arrow")}</button><span>Controle à esquerda · esquiva e habilidade à direita</span></div></main>`;
  }
  private menuScreen() {
    const g = this.game;
    return `<main class="menu-layout"><section class="menu-copy"><span class="eyebrow"><i class="live-dot"></i> EXPEDIÇÃO 001 / O NÚCLEO</span><h1>Encontre<br>seu <em>ritmo.</em></h1><p class="lead">Mova-se para sobreviver.<br>Pare para atacar. Evolua a cada escolha.</p><div class="run-facts"><span><b>03</b> atos</span><span><b>12</b> encontros</span><span><b>01</b> vida</span></div><div class="menu-records"><span>${icon("crown")}<b>${g.records.wins}</b> vitórias</span><span>Melhor avanço <b>${g.records.bestRoom}/12</b></span><span>${g.records.bestTime ? `Recorde <b>${formatTime(g.records.bestTime)}</b>` : `${g.records.runs} runs concluídas`}</span></div></section>
      <section class="loadout panel" aria-labelledby="loadout-title"><div class="panel-heading"><span class="eyebrow">ANTES DO PRIMEIRO PASSO</span><span class="small-index">01—03</span></div><h2 id="loadout-title">Escolha seu caminho</h2><p class="muted">Sua habilidade define o início. Suas escolhas, o destino.</p>
      <div class="class-list" role="group" aria-label="Caminho inicial">${(
        Object.keys(CLASSES) as ClassId[]
      )
        .map((id, index) => {
          const stats = CLASSES[id];
          return `<button class="class-card ${this.selected === id ? "selected" : ""}" style="--class-color:${stats.color}" data-action="class" data-value="${id}" aria-pressed="${this.selected === id}"><span class="class-symbol">${icon(["target", "bolt", "shield"][index])}</span><span><strong>${stats.name}</strong><small>${stats.title}</small></span><span class="radio-dot"></span></button>`;
        })
        .join(
          "",
        )}</div><div class="skill-preview">${icon("bolt")}<p><strong>${CLASSES[this.selected].skill}</strong><span>${CLASSES[this.selected].desc}</span></p><kbd>Q</kbd></div>
      <div class="seed-row"><label for="seed">CÓDIGO DA RUN <input id="seed" maxlength="40" autocomplete="off" spellcheck="false" aria-describedby="seed-help"></label><button class="icon-button" data-action="random" aria-label="Gerar novo código">${icon("repeat")}</button><button class="text-button" data-action="daily">Diária UTC</button></div><p class="seed-note" id="seed-help">Mesmo código, mesmos encontros e ofertas. A build é sua.</p><button class="primary start-button" data-action="start">Iniciar expedição ${icon("arrow")}</button><span class="loadout-footnote">Sem melhorias permanentes. Cada run começa do zero.</span></section>
      <div class="menu-controls"><span><kbd>W A S D</kbd> mover</span><span><kbd>ESPAÇO</kbd> esquivar</span><span><kbd>Q</kbd> habilidade</span><button class="text-button" data-action="help">Como jogar ${icon("arrow")}</button></div></main>`;
  }
  private rewardScreen() {
    const g = this.game;
    const boss = g.run.room % 4 === 0;
    return `<section class="wide-dialog" role="dialog" aria-modal="true" aria-labelledby="screen-title"><div class="reward-heading"><span class="eyebrow">${boss ? "GUARDIÃO SUPERADO · +25% DE VIDA · +1 TROCA" : `ENCONTRO ${String(g.run.room).padStart(2, "0")} CONCLUÍDO`}</span><h1 id="screen-title">Sua próxima <em>possibilidade.</em></h1><p>Escolha uma melhoria. Ela acompanha você até o fim desta run.</p></div><div class="reward-grid">${g.run.offers
      .map((id, index) => {
        const reward = REWARDS.find((r) => r.id === id)!;
        return `<button class="reward-card" style="--class-color:${reward.color}" data-action="reward" data-value="${id}"><div class="reward-card-top"><span class="eyebrow">${reward.tag}</span><span>0${index + 1}</span></div><div class="reward-symbol">${icon(reward.tag === "ATIRADOR" ? "target" : reward.tag === "COLOSSO" ? "shield" : "bolt")}</div><h2>${reward.name}</h2><p>${reward.desc}</p><div class="reward-card-bottom"><span>NÍVEL ${(g.run.rewards[id] ?? 0) + 1} / ${reward.max}</span>${icon("arrow")}</div></button>`;
      })
      .join(
        "",
      )}</div><div class="reward-footer"><span>${icon("coin")} ${g.run.gold} ouro coletado · nenhuma coleta ficou para trás</span><button class="secondary" data-action="reroll" ${!g.run.rerolls ? "disabled" : ""}>${icon("repeat")} Trocar ofertas <span class="count">${g.run.rerolls}</span></button></div></section>`;
  }
  private campScreen() {
    const g = this.game,
      nextBoss = (g.run.room + 1) % 4 === 0;
    const nextAct = Math.ceil((g.run.room + 1) / 4);
    return `<section class="wide-dialog camp-dialog" role="dialog" aria-modal="true" aria-labelledby="screen-title"><div class="camp-heading"><div><span class="eyebrow">ENTRE UM PASSO E OUTRO</span><h1 id="screen-title">Prepare o <em>próximo.</em></h1><p>Invista no que falta ou guarde ouro. Você escolhe quando seguir.</p></div><span class="gold-balance">${icon("coin")} ${g.run.gold}<small>OURO DISPONÍVEL</small></span></div><div class="camp-columns"><div class="camp-shop"><article class="shop-item"><div class="shop-icon">${icon("heart")}</div><div><h3>Recuperar o fôlego</h3><p>Cura 40% da vida máxima. Uma compra por descanso.</p><small>${Math.ceil(g.player.hp)} / ${g.player.maxHp} de vida</small></div><button class="secondary" data-action="heal" ${g.run.healed || g.player.hp >= g.player.maxHp || g.run.gold < g.healCost ? "disabled" : ""}>${g.run.healed ? "Utilizado" : g.player.hp >= g.player.maxHp ? "Vida cheia" : `${g.healCost} ouro`}</button></article><article class="shop-item"><div class="shop-icon">${icon("target")}</div><div><h3>Afiar a precisão</h3><p>+8% de dano básico nesta run. Até duas compras por descanso.</p><small>${g.run.purchases} / 2 reforços adquiridos</small></div><button class="secondary" data-action="forge" ${g.run.purchases >= 2 || g.run.gold < g.forgeCost ? "disabled" : ""}>${g.run.purchases >= 2 ? "Esgotado" : `${g.forgeCost} ouro`}</button></article><div class="next-encounter ${nextBoss ? "boss-preview" : ""}">${icon(nextBoss ? "crown" : "mark")}<div><span class="eyebrow">A SEGUIR · ATO ${nextAct}</span><strong>${nextBoss ? ACTS[nextAct - 1].boss : ACTS[nextAct - 1].name}</strong><p>${nextBoss ? "Guardião: observe os avisos no chão e reserve sua esquiva." : ACTS[nextAct - 1].subtitle}</p></div></div></div><aside class="build-panel"><span class="eyebrow">SUA CONSTRUÇÃO</span><h3>${CLASSES[g.run.classId].name}</h3><div class="stat-line"><span>Dano básico</span><b>${g.player.damage.toFixed(1)}</b></div><div class="stat-line"><span>Recarga parado</span><b>${g.player.reload.toFixed(2)}s</b></div><div class="stat-line"><span>Vida máxima</span><b>${g.player.maxHp}</b></div><div class="build-tags">${this.buildTags()}</div></aside></div><div class="camp-footer"><span>Melhorias e ouro pertencem apenas a esta run.</span><button class="primary" data-action="next">${nextBoss ? "Enfrentar guardião" : `Seguir para o encontro ${g.run.room + 1}`} ${icon("arrow")}</button></div></section>`;
  }
  private resultScreen() {
    const g = this.game;
    return this.dialog(
      `<div class="emblem ${g.run.won ? "" : "fallen"}">${icon(g.run.won ? "crown" : "mark")}</div><span class="eyebrow">${g.run.won ? "OS TRÊS GUARDIÕES CAÍRAM" : "A EXPEDIÇÃO CHEGOU AO FIM"}</span><h1 id="screen-title">${g.run.won ? "Você encontrou<br>seu <em>ritmo.</em>" : "Todo fim é<br>um novo <em>começo.</em>"}</h1><p>${g.run.won ? "O núcleo silenciou. Uma nova construção espera na próxima run." : "Leve a experiência. Deixe o restante. Tente outro caminho."}</p><div class="result-stats"><div><strong>${g.run.room}<small>/12</small></strong><span>ENCONTRO</span></div><div><strong>${g.run.bosses}<small>/3</small></strong><span>GUARDIÕES</span></div><div><strong>${formatTime(g.run.elapsed)}</strong><span>TEMPO ATIVO</span></div><div><strong>${g.run.kills}</strong><span>ELIMINAÇÕES</span></div></div><div class="result-build"><span class="eyebrow">${CLASSES[g.run.classId].name.toUpperCase()} · SUA BUILD</span><div class="build-tags">${this.buildTags()}</div></div><div class="stack-actions"><button class="primary" data-action="retry">Repetir código e caminho ${icon("repeat")}</button><button class="secondary" data-action="menu">Nova expedição ${icon("arrow")}</button></div><p class="result-seed">CÓDIGO <code>${escape(g.run.seed)}</code> · Recordes salvos neste navegador</p>`,
      "result-dialog",
    );
  }
  private buildTags() {
    const entries = Object.entries(this.game.run.rewards);
    return entries.length
      ? entries
          .map(
            ([id, count]) =>
              `<span title="${escape(REWARDS.find((r) => r.id === id)!.desc)}">${REWARDS.find((r) => r.id === id)!.name}${count > 1 ? ` ×${count}` : ""}</span>`,
          )
          .join("")
      : '<span class="muted">Seu caminho ainda está se formando.</span>';
  }
  private helpScreen() {
    if (this.layout.mode === "mobile")
      return this.dialog(
        `<span class="eyebrow">FEITO PARA OS SEUS POLEGARES</span><h1 id="screen-title">Toque. Mova.<br><em>Encontre espaço.</em></h1><div class="help-list mobile-help"><div>${icon("target")}<p><b>Arraste o controle esquerdo para mover.</b> Solte o dedo para parar e disparar automaticamente no inimigo mais próximo.</p></div><div>${icon("arrow")}<p><b>Toque em Esquiva para escapar.</b> Funciona enquanto você move com o outro dedo. A proteção é breve; a recarga aparece no botão.</p></div><div>${icon("bolt")}<p><b>Toque em Habilidade para abrir espaço.</b> Cada caminho tem um poder diferente. O botão ilumina quando estiver pronto.</p></div><div>${icon("crown")}<p><b>Evite os círculos anunciados pelos chefes.</b> A arena inteira fica visível; os controles têm uma área própria fora do campo de combate.</p></div><div>${icon("pause")}<p><b>Pause pelo botão no topo.</b> Girar a tela ou sair da aba também pausa. Funciona em pé e deitado.</p></div></div><p class="help-note">Cada run começa do zero. Só seus recordes ficam salvos. Você pode trocar entre a interface de celular e desktop no seletor do topo.</p><button class="primary" data-action="close-help">Entendi ${icon("arrow")}</button>`,
        "help-dialog",
      );
    return this.dialog(
      `<span class="eyebrow">O BÁSICO, SEM MISTÉRIO</span><h1 id="screen-title">Jogue no seu <em>ritmo.</em></h1><div class="help-list"><div><kbd>WASD / ↑↓←→</kbd><p><b>Mova-se para escapar.</b> O personagem mira automaticamente no inimigo mais próximo.</p></div><div>${icon("target")}<p><b>Pare para disparar.</b> O contorno mostra a recarga. Em movimento ela avança a 65% da velocidade.</p></div><div><kbd>ESPAÇO</kbd><p><b>Esquive com invulnerabilidade.</b> Use uma direção ou repita a última. Recarga de 3 segundos.</p></div><div><kbd>Q</kbd><p><b>Use sua habilidade.</b> Cada caminho tem uma ação diferente. Ela também funciona em movimento.</p></div><div>${icon("crown")}<p><b>Três atos. Três guardiões.</b> Escolha melhorias entre encontros. Chefes mudam de ritmo com metade da vida; saia dos círculos antes de explodirem.</p></div><div><kbd>ESC</kbd><p><b>Pause quando precisar.</b> Trocar de aba também pausa. No celular, use o controle de movimento e os botões na arena.</p></div></div><p class="help-note">Runs não continuam após fechar a página. Só os recordes ficam salvos. A diária usa a data UTC; caminhos diferentes podem ter dificuldades diferentes.</p><button class="primary" data-action="close-help">Entendi ${icon("arrow")}</button>`,
      "help-dialog",
    );
  }
  private dialog(content: string, className = "") {
    return `<section class="dialog ${className}" role="dialog" aria-modal="true" aria-label="${this.help ? "Como jogar" : this.game.phase === "paused" ? "Jogo pausado" : "Resultado da run"}">${content}</section>`;
  }
}
