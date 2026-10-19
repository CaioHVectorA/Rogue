import type { Game } from "../game/engine";
import { ACTS, CLASSES, REWARDS, TOTAL_ROOMS, formatTime } from "../game/model";
import type { ClassId } from "../game/model";
import { icon } from "./icons";
import { ITEM_VISUALS, pilotPortrait, statChip } from "./arsenal";
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
  settings = false;
  itemDetails = false;
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
      <header class="masthead"><a class="brand" href="#" aria-label="Rogue — início">${icon("mark")}ROGUE</a><div class="header-actions"><button class="icon-button" data-action="sound" aria-label="Alternar som"></button><button class="icon-button" data-action="help" aria-label="Como jogar">${icon("book")}</button><button class="icon-button" data-action="settings" aria-label="Configurações">${icon("gear")}</button></div></header>
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
    root.addEventListener("change", (event) => {
      if ((event.target as HTMLElement).matches('[aria-label="Interface"]'))
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
        if (this.settings) {
          this.settings = false;
          this.render();
        } else if (this.help) {
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
            'button:not(:disabled), input, select, [tabindex="0"]',
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
      case "settings":
        if (g.phase === "combat") g.pause();
        this.settings = true;
        this.render();
        break;
      case "close-settings":
        this.settings = false;
        this.render();
        break;
      case "item-info":
        this.itemDetails = !this.itemDetails;
        this.render();
        break;
      case "effects":
        g.toggleEffects();
        break;
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
    if (active) {
      this.renderHud();
      this.hud.insertAdjacentHTML(
        "beforeend",
        '<div class="combo-display" aria-label="Sequência de eliminações" hidden><span id="combo-rank"></span><strong id="combo-value"></strong><div class="combo-fuse"><i></i></div></div>',
      );
    }
    const previousFocus = (document.activeElement as HTMLElement)?.dataset
      .action;
    const previousValue = (document.activeElement as HTMLElement)?.dataset
      .value;
    this.overlay.classList.toggle(
      "is-gameplay",
      g.phase === "combat" && !this.help && !this.settings,
    );
    this.overlay.innerHTML = this.settings
      ? this.settingsScreen()
      : this.help
        ? this.helpScreen()
        : this.screen();
    const modeSelect = this.root.querySelector<HTMLSelectElement>(
      '[aria-label="Interface"]',
    );
    if (modeSelect) modeSelect.value = this.layout.preference;
    this.overlay.classList.toggle("item-details", this.itemDetails);
    const modal = !!this.overlay.querySelector('[role="dialog"]');
    this.root.querySelector<HTMLElement>(".masthead")!.inert = modal;
    this.hud.inert = modal;
    const seedInput = this.overlay.querySelector<HTMLInputElement>("#seed");
    if (seedInput) seedInput.value = this.seed;
    if (this.previousPhase !== g.phase || this.help || this.settings) {
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
    this.hud.innerHTML = `<div class="hud-top"><div class="vitals"><div class="vital-label">${icon("heart")}<strong id="hp-value"></strong></div><div class="meter"><i id="hp-meter"></i></div></div>
      <div class="route-mini">${Array.from({ length: TOTAL_ROOMS }, (_, i) => `<span class="${i + 1 < g.run.room ? "complete" : i + 1 === g.run.room ? "current" : ""} ${(i + 1) % 4 === 0 ? "boss-node" : ""}" title="Encontro ${i + 1}">${(i + 1) % 4 === 0 ? icon("crown") : ""}</span>`).join("")}</div>
      <div class="run-counters"><span>${icon("coin")}<b id="gold-value"></b></span><span id="time-value"></span><button class="icon-button" data-action="pause" aria-label="Pausar jogo">${icon("pause")}</button></div></div>
      <div class="boss-health" id="boss-health" hidden><div><span>${ACTS[g.run.act - 1].boss}</span><small id="boss-phase">GUARDIÃO DO ATO ${g.run.act}</small></div><div class="meter"><i id="boss-meter"></i></div></div>
      <div class="hud-bottom"><div class="encounter-label"><span class="eyebrow">ATO ${String(g.run.act).padStart(2, "0")} / ${ACTS[g.run.act - 1].name.toUpperCase()}</span><strong>WAVE ${String(g.run.room).padStart(2, "0")}<small> / 12</small></strong><span id="combat-hint"></span></div>
      <div class="abilities"><div class="ability"><kbd>ESPAÇO</kbd><div><strong>Esquiva</strong><span id="dash-value"></span></div></div><div class="ability"><kbd>Q</kbd><div><strong>${CLASSES[g.run.classId].skill}</strong><span id="skill-value"></span></div></div><div class="reload-ring" id="reload-state">${icon("target")}</div></div></div>`;
  }
  tick() {
    const g = this.game;
    if (g.phase === "menu") return;
    const text = (id: string, value: string) => {
      const el = this.hud.querySelector<HTMLElement>(`#${id}`);
      if (el && el.textContent !== value) el.textContent = value;
    };
    const combo = this.hud.querySelector<HTMLElement>(".combo-display")!;
    combo.hidden = g.combo < 3 || g.phase !== "combat";
    text("combo-value", `${g.combo} HIT`);
    text(
      "combo-rank",
      g.combo >= 40
        ? "ANNIHILATION"
        : g.combo >= 20
          ? "MASSACRE"
          : g.combo >= 10
            ? "RAMPAGE"
            : "CHAIN",
    );
    combo.classList.toggle("massacre", g.combo >= 20);
    combo.querySelector<HTMLElement>("i")!.style.width =
      `${(g.comboTimer / 3.5) * 100}%`;
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
      g.phase === "combat" ? `${g.enemies.length + g.spawnQueue.length}` : "—",
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
      text("boss-phase", boss.enraged ? "II" : `I / ${g.run.act}`);
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
          `<div class="emblem">${icon("pause")}</div><h1>PAUSA</h1><div class="stack-actions"><button class="primary" data-action="pause" aria-label="Continuar a run">RETOMAR ${icon("arrow")}</button><button class="secondary" data-action="help" aria-label="Controles e regras">CONTROLES ${icon("book")}</button><button class="text-button danger" data-action="abandon" aria-label="${this.confirmAbandon ? "Confirmar encerramento desta run" : "Encerrar esta run"}">${this.confirmAbandon ? "CONFIRMAR SAÍDA" : "SAIR"}</button></div>`,
        );
      case "result":
        return this.resultScreen();
    }
  }
  private mobileMenuScreen() {
    return this.loadoutScreen(true);
  }
  private menuScreen() {
    return this.loadoutScreen(false);
  }
  private loadoutScreen(mobile: boolean) {
    const g = this.game,
      current = CLASSES[this.selected];
    const cards = (Object.keys(CLASSES) as ClassId[])
      .map((id, index) => {
        const stats = CLASSES[id];
        return `<button class="pilot-select ${mobile ? "mobile-class" : "class-card"} ${id === this.selected ? "selected" : ""}" style="--class-color:${stats.color}" data-action="class" data-value="${id}" aria-label="${stats.name} ${stats.title}" aria-pressed="${id === this.selected}"><span class="pilot-index">0${index + 1}</span>${pilotPortrait(id)}<strong>${stats.name}</strong><span class="pilot-kit">${icon(["target", "bolt", "shield"][index])}<b>${stats.hp}</b>${icon("heart")}</span><span class="pilot-lock">${id === this.selected ? "EQUIPADO" : "+"}</span></button>`;
      })
      .join("");
    const seed = `<div class="seed-row"><label for="seed">SEED <input id="seed" aria-label="CÓDIGO DA RUN" maxlength="40" autocomplete="off" spellcheck="false" aria-describedby="seed-help"></label><button class="icon-button" data-action="random" aria-label="Gerar novo código">${icon("repeat")}</button><button class="text-button" data-action="daily">DIÁRIA</button></div><span id="seed-help" class="sr-only">Mesmo código e escolhas, mesmas ofertas.</span>`;
    return `<main class="arcade-menu ${mobile ? "mobile-menu" : "menu-layout"}"><div class="arcade-title"><span class="game-kicker">SURVIVE · EVOLVE · REPEAT</span><h1>ROGUE<span>COREBREAKER</span></h1><div class="boss-seals">${[1, 2, 3].map((n) => `<span>${icon("crown")}<b>${n}</b></span>`).join("")}</div></div><section class="pilot-deck" aria-label="Escolha de personagem"><div class="deck-label"><span>SELECIONE SEU PILOTO</span><span>01 / 03</span></div><div class="pilot-roster ${mobile ? "mobile-class-list" : "class-list"}" role="group" aria-label="Caminho inicial">${cards}</div><div class="equipped-skill" style="--class-color:${current.color}">${icon("bolt")}<div><strong>${current.skill}</strong><span>${mobile ? "TOQUE" : "Q"}</span></div><p>${current.desc.replace("Q ", "")}</p></div></section><div class="launch-panel">${mobile ? `<details class="mobile-seed"><summary>${icon("coin")} SEED / DIÁRIA</summary>${seed}</details>` : seed}<button class="primary start-button" data-action="start" aria-label="Iniciar expedição">${icon("target")}<span>JOGAR</span>${icon("arrow")}</button><div class="arcade-records"><span>${icon("crown")} ${g.records.wins}</span><span>${icon("mark")} ${g.records.bestRoom}/12</span><button class="text-button" data-action="help" aria-label="Como jogar">${icon("book")} CONTROLES</button></div></div></main>`;
  }
  private rewardScreen() {
    const g = this.game,
      boss = g.run.room % 4 === 0;
    return `<section class="wide-dialog loot-screen" role="dialog" aria-modal="true" aria-labelledby="screen-title"><div class="loot-banner"><span>${icon(boss ? "crown" : "skull")}</span><div><small>WAVE ${g.run.room.toString().padStart(2, "0")} CLEAR</small><h1 id="screen-title">${boss ? "GUARDIÃO ABATIDO" : "UPGRADE!"}</h1></div><button class="icon-button" data-action="item-info" aria-label="Mostrar descrições das melhorias" aria-pressed="${this.itemDetails}">${icon("book")}</button></div><div class="reward-grid">${g.run.offers
      .map((id) => {
        const reward = REWARDS.find((r) => r.id === id)!,
          item = ITEM_VISUALS[id];
        return `<button class="reward-card loot-card" style="--class-color:${reward.color}" data-action="reward" data-value="${id}" aria-label="${escape(reward.name)}. ${escape(reward.desc)}"><div class="loot-category">${reward.tag}</div><div class="loot-object">${icon(item.glyph)}</div><div class="loot-stat"><strong>${item.value}</strong><span>${item.stat}</span></div><h2>${reward.name}</h2><span class="loot-hint">${item.hint}</span><p class="item-description">${reward.desc}</p><div class="loot-pips">${Array.from({ length: reward.max }, (_, i) => `<i class="${i <= (g.run.rewards[id] ?? 0) ? "lit" : ""}"></i>`).join("")}</div><span class="loot-select">EQUIPAR ${icon("arrow")}</span></button>`;
      })
      .join(
        "",
      )}</div><div class="loot-footer"><span>${icon("coin")} ${g.run.gold}</span>${boss ? `<span class="boss-bounty">${icon("heart")} +25% ${icon("repeat")} +1</span>` : ""}<button class="secondary" data-action="reroll" aria-label="Trocar ofertas" ${!g.run.rerolls ? "disabled" : ""}>${icon("repeat")} <b>${g.run.rerolls}</b></button></div></section>`;
  }
  private campScreen() {
    const g = this.game,
      boss = (g.run.room + 1) % 4 === 0;
    return `<section class="wide-dialog armory-screen" role="dialog" aria-modal="true" aria-labelledby="screen-title"><div class="loot-banner"><span>${icon("shield")}</span><div><small>CHECKPOINT ${g.run.room.toString().padStart(2, "0")}</small><h1 id="screen-title">ARSENAL</h1></div><span class="armory-gold">${icon("coin")} ${g.run.gold}</span></div><div class="armory-body"><div class="armory-items"><button class="shop-crate" data-action="heal" aria-label="Recuperar o fôlego. Cura 40% da vida máxima" ${g.run.healed || g.player.hp >= g.player.maxHp || g.run.gold < g.healCost ? "disabled" : ""}><span class="crate-symbol">${icon("heart")}</span><strong>+40%</strong><small>VIDA</small><span class="crate-price">${g.run.healed ? "USADO" : g.player.hp >= g.player.maxHp ? "MAX" : `${icon("coin")} ${g.healCost}`}</span></button><button class="shop-crate" data-action="forge" aria-label="Afiar a precisão. Mais 8% de dano" ${g.run.purchases >= 2 || g.run.gold < g.forgeCost ? "disabled" : ""}><span class="crate-symbol">${icon("target")}</span><strong>+8%</strong><small>DANO</small><span class="crate-price">${g.run.purchases >= 2 ? "MAX" : `${icon("coin")} ${g.forgeCost}`}</span></button></div><aside class="loadout-snapshot"><div class="equipped-stats">${statChip("heart", `${Math.ceil(g.player.hp)}/${g.player.maxHp}`, "VIDA")}${statChip("target", g.player.damage.toFixed(0), "DANO")}${statChip("repeat", `${g.player.reload.toFixed(2)}s`, "RECARGA")}</div><div class="equipped-inventory">${Object.entries(
      g.run.rewards,
    )
      .map(
        ([id, count]) =>
          `<span title="${REWARDS.find((r) => r.id === id)!.name}">${icon(ITEM_VISUALS[id].glyph)}<b>${count}</b></span>`,
      )
      .join(
        "",
      )}</div></aside></div><div class="armory-next"><span>${icon(boss ? "crown" : "skull")} ${boss ? ACTS[Math.ceil((g.run.room + 1) / 4) - 1].boss.toUpperCase() : `WAVE ${g.run.room + 1}`}</span><button class="primary" data-action="next">${boss ? "ENFRENTAR" : "AVANÇAR"} ${icon("arrow")}</button></div></section>`;
  }
  private resultScreen() {
    const g = this.game;
    return this.dialog(
      `<div class="result-medal">${icon(g.run.won ? "crown" : "skull")}</div><span class="game-kicker">${g.run.won ? "CORE DESTROYED" : "RUN OVER"}</span><h1 id="screen-title">${g.run.won ? "VITÓRIA" : "DERROTA"}</h1><div class="result-stats"><div><strong>${g.run.kills}</strong><span>ABATES</span></div><div><strong>${g.peakCombo}</strong><span>SEQUÊNCIA</span></div><div><strong>${g.run.room}<small>/12</small></strong><span>WAVE</span></div><div><strong>${formatTime(g.run.elapsed)}</strong><span>TEMPO</span></div></div><div class="equipped-inventory result-inventory">${Object.entries(
        g.run.rewards,
      )
        .map(
          ([id, count]) =>
            `<span title="${REWARDS.find((r) => r.id === id)!.name}">${icon(ITEM_VISUALS[id].glyph)}<b>${count}</b></span>`,
        )
        .join(
          "",
        )}</div><div class="stack-actions"><button class="primary" data-action="retry" aria-label="Repetir código e caminho">${icon("repeat")} REPETIR</button><button class="secondary" data-action="menu" aria-label="Nova expedição">ESCOLHER PILOTO ${icon("arrow")}</button></div><p class="result-seed">SEED <code>${escape(g.run.seed)}</code></p>`,
      "result-dialog",
    );
  }
  private settingsScreen() {
    return this.dialog(
      `<span class="emblem">${icon("gear")}</span><h1>CONFIGURAÇÕES</h1><div class="settings-row"><label for="interface-mode">INTERFACE</label><select id="interface-mode" aria-label="Interface"><option value="auto">Auto</option><option value="mobile">Celular</option><option value="desktop">Desktop</option></select></div><button class="secondary effects-choice" data-action="effects">${icon("explosion")} EFEITOS <strong>${this.game.reducedMotion ? "REDUZIDOS" : "COMPLETOS"}</strong></button><button class="primary" data-action="close-settings" aria-label="Fechar configurações">VOLTAR ${icon("arrow")}</button>`,
      "settings-dialog",
    );
  }
  private helpScreen() {
    if (this.layout.mode === "mobile")
      return this.dialog(
        `<span class="eyebrow">FEITO PARA OS SEUS POLEGARES</span><h1 id="screen-title">Toque. Mova.<br><em>Encontre espaço.</em></h1><div class="help-list mobile-help"><div>${icon("target")}<p><b>Arraste o controle esquerdo para mover.</b> Solte o dedo para parar e disparar automaticamente no inimigo mais próximo.</p></div><div>${icon("arrow")}<p><b>Toque em Esquiva para escapar.</b> Funciona enquanto você move com o outro dedo. A proteção é breve; a recarga aparece no botão.</p></div><div>${icon("bolt")}<p><b>Toque em Habilidade para abrir espaço.</b> Cada caminho tem um poder diferente. O botão ilumina quando estiver pronto.</p></div><div>${icon("crown")}<p><b>Evite os círculos anunciados pelos chefes.</b> A arena inteira fica visível; os controles têm uma área própria fora do campo de combate.</p></div><div>${icon("pause")}<p><b>Pause pelo botão no topo.</b> Girar a tela ou sair da aba também pausa. Funciona em pé e deitado.</p></div></div><p class="help-note">Cada run começa do zero. Só seus recordes ficam salvos. Você pode trocar entre a interface de celular e desktop nas configurações da engrenagem.</p><button class="primary" data-action="close-help">Entendi ${icon("arrow")}</button>`,
        "help-dialog",
      );
    return this.dialog(
      `<span class="eyebrow">O BÁSICO, SEM MISTÉRIO</span><h1 id="screen-title">Jogue no seu <em>ritmo.</em></h1><div class="help-list"><div><kbd>WASD / ↑↓←→</kbd><p><b>Mova-se para escapar.</b> O personagem mira automaticamente no inimigo mais próximo.</p></div><div>${icon("target")}<p><b>Pare para disparar.</b> O contorno mostra a recarga. Em movimento ela avança a 65% da velocidade.</p></div><div><kbd>ESPAÇO</kbd><p><b>Esquive com invulnerabilidade.</b> Use uma direção ou repita a última. Recarga de 3 segundos.</p></div><div><kbd>Q</kbd><p><b>Use sua habilidade.</b> Cada caminho tem uma ação diferente. Ela também funciona em movimento.</p></div><div>${icon("crown")}<p><b>Três atos. Três guardiões.</b> Escolha melhorias entre encontros. Chefes mudam de ritmo com metade da vida; saia dos círculos antes de explodirem.</p></div><div><kbd>ESC</kbd><p><b>Pause quando precisar.</b> Trocar de aba também pausa. No celular, use o controle de movimento e os botões na arena.</p></div></div><p class="help-note">Runs não continuam após fechar a página. Só os recordes ficam salvos. A diária usa a data UTC; caminhos diferentes podem ter dificuldades diferentes.</p><button class="primary" data-action="close-help">Entendi ${icon("arrow")}</button>`,
      "help-dialog",
    );
  }
  private dialog(content: string, className = "") {
    return `<section class="dialog ${className}" role="dialog" aria-modal="true" aria-label="${this.settings ? "Configurações" : this.help ? "Como jogar" : this.game.phase === "paused" ? "Jogo pausado" : "Resultado da run"}">${content}</section>`;
  }
}
