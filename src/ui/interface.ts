import type { Game } from "../game/engine";
import {
  ACTS,
  CLASSES,
  WEAPONS,
  weaponById,
  buildElements,
  rewardSynergy,
  REWARDS,
  SKILLS,
  ULTIMATES,
  isUltimate,
  HERO_STATS,
  TRAINING_CAP,
  trainingCost,
  skillById,
  comboLootChance,
  TOTAL_ROOMS,
  formatTime,
} from "../game/model";
import type { ClassId, WeaponId, HeroStat } from "../game/model";
import { powerDiagram, powerInfo, PowerPreviews } from "./power-guide";
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
  seed = freshSeed();
  help = false;
  settings = false;
  laboratory = false;
  inspectedPower: string | null = null;
  private resumePower = false;
  private previews = new PowerPreviews();
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
      <header class="masthead"><a class="brand" href="#" aria-label="Rogue — início">${icon("mark")}ROGUE</a><div class="header-actions"><button class="icon-button lab-launch" data-action="lab" aria-label="Laboratório de gameplay" title="Laboratório · F2">${icon("flask")}</button><button class="icon-button" data-action="sound" aria-label="Alternar som"></button><button class="icon-button" data-action="help" aria-label="Como jogar">${icon("book")}</button><button class="icon-button" data-action="settings" aria-label="Configurações">${icon("gear")}</button></div></header>
      <section class="hud" aria-label="Estado da run" hidden></section>
      <div class="overlay"></div>
      <div class="touch-controls" hidden><div class="movement-control"><div class="joystick" aria-label="Arraste para mover"><span></span></div><span class="stick-hint">SOLTE PARA ATIRAR</span></div><div class="touch-actions"><button data-action="dash" aria-label="Esquivar">${icon("arrow")}<span>Esquiva</span><small data-touch-cooldown="dash">Pronta</small></button><button data-action="skill" aria-label="Usar habilidade">${icon("bolt")}<span data-skill-name="0">Habilidade</span><small data-touch-cooldown="skill">Pronta</small></button><button data-action="skill2" aria-label="Usar ultimate" hidden>${icon("bolt")}<span data-skill-name="1">Habilidade E</span><small>Pronta</small></button></div></div>
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
      const select = event.target as HTMLSelectElement;
      if (select.dataset.labSlot !== undefined)
        this.game.labEquip(
          select.value,
          Number(select.dataset.labSlot) as 0 | 1,
        );
      if (select.id === "lab-weapon") this.game.labWeapon(select.value);
      if (select.id === "lab-speed" && this.game.run.practice)
        this.game.labSpeed = Number(select.value);
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
      if (event.key === "F2") {
        event.preventDefault();
        this.action("lab");
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (this.inspectedPower) {
          this.action("close-power");
        } else if (this.laboratory) {
          this.laboratory = false;
          this.render();
        } else if (this.settings) {
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
      case "inspect-power":
        this.resumePower = g.phase === "combat";
        if (g.phase === "combat") g.pause();
        this.inspectedPower = value!;
        this.render();
        break;
      case "close-power":
        this.inspectedPower = null;
        if (this.resumePower && g.phase === "paused") g.pause();
        else this.render();
        this.resumePower = false;
        break;
      case "weapon":
        g.equipWeapon(value as WeaponId);
        break;
      case "lab":
        this.inspectedPower = null;
        if (g.phase === "combat") g.pause();
        this.settings = this.help = false;
        this.laboratory = true;
        this.render();
        break;
      case "lab-close":
        this.laboratory = false;
        this.render();
        break;
      case "lab-jump": {
        const valueOf = (id: string) =>
          this.root.querySelector<HTMLSelectElement>(`#${id}`)!.value;
        const room = Number(valueOf("lab-room")),
          phase = Number(valueOf("lab-phase")),
          build = valueOf("lab-build"),
          pilot = valueOf("lab-pilot") as ClassId;
        this.laboratory = false;
        g.practice(
          room,
          phase,
          build,
          pilot,
          valueOf("lab-state") as "combat" | "reward" | "camp" | "result",
        );
        break;
      }
      case "lab-god":
        if (g.run.practice) {
          g.labGod = !g.labGod;
          this.render();
        }
        break;
      case "lab-perk":
        g.labPerk(value!);
        break;
      case "lab-clear":
        this.laboratory = false;
        if (g.phase === "paused") g.pause();
        g.labClear();
        break;
      case "skill2":
        g.skill(1);
        break;
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
      case "start":
        g.start("ranger", this.seed.trim() || freshSeed());
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
      case "train":
        g.buy(value as HeroStat);
        break;
      case "next":
        g.nextRoom();
        break;
      case "retry":
        g.start("ranger", g.run.seed);
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
      const weapon = weaponById(g.run.weapon);
      this.hud.insertAdjacentHTML(
        "beforeend",
        `<button class="weapon-indicator" data-action="inspect-power" data-value="weapon:${weapon.id}" aria-label="Entender ataque: ${weapon.name}">${icon(weapon.glyph)}<span>${weapon.name}</span><small>AUTO</small></button>`,
      );
      this.hud.insertAdjacentHTML(
        "beforeend",
        '<div class="combo-display" aria-label="Sequência de acertos e abates" hidden><span id="combo-rank"></span><strong id="combo-value"></strong><div class="combo-fuse"><i></i></div><small class="combo-loot" id="combo-loot"></small></div>',
      );
    }
    const previousFocus = (document.activeElement as HTMLElement)?.dataset
      .action;
    const previousValue = (document.activeElement as HTMLElement)?.dataset
      .value;
    this.overlay.classList.toggle(
      "is-gameplay",
      g.phase === "combat" &&
        !this.help &&
        !this.settings &&
        !this.laboratory &&
        !this.inspectedPower,
    );
    this.previews.stop();
    this.overlay.innerHTML = this.inspectedPower
      ? this.powerScreen(this.inspectedPower)
      : this.laboratory
        ? this.labScreen()
        : this.settings
          ? this.settingsScreen()
          : this.help
            ? this.helpScreen()
            : this.screen();
    this.previews.mount(this.overlay, g.reducedMotion);
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
    if (
      this.previousPhase !== g.phase ||
      this.help ||
      this.settings ||
      this.laboratory ||
      this.inspectedPower
    ) {
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
      <div class="abilities"><div class="ability"><kbd>ESPAÇO</kbd><div><strong>Esquiva</strong><span id="dash-value"></span></div></div>${g.run.skills.map((id, slot) => (id ? `<button class="ability power-button ${slot === 1 && isUltimate(id) ? "ultimate-ability" : ""}" data-action="inspect-power" data-value="${isUltimate(id) ? "ultimate" : "skill"}:${id}" title="Entender ${skillById(id).name}">${icon(skillById(id).glyph)}<kbd>${slot === 0 ? "Q" : "E"}</kbd><div><strong>${skillById(id).name}</strong><span id="${slot === 0 ? "skill-value" : "second-value"}"></span></div></button>` : `<div class="ability locked-slot"><kbd>${slot === 0 ? "Q" : "E"}</kbd><span>WAVE ${slot === 0 ? "2" : "8 · ULT"}</span></div>`)).join("")}<div class="reload-ring" id="reload-state">${icon("target")}</div></div></div>`;
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
      "combo-loot",
      `♦ +${Math.round(comboLootChance(g.combo) * 100)}% EXTRA`,
    );
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
    text(
      "second-value",
      g.run.skills[1] && isUltimate(g.run.skills[1])
        ? g.run.ultimateCharge >= 100 && g.player.secondCd <= 0
          ? "ULTIMATE PRONTA"
          : `${Math.floor(g.run.ultimateCharge)}%`
        : g.player.secondCd > 0
          ? `${g.player.secondCd.toFixed(1)}s`
          : "Pronta",
    );
    const ultimateAbility =
      this.hud.querySelector<HTMLElement>(".ultimate-ability");
    ultimateAbility?.style.setProperty(
      "--ultimate-fill",
      `${g.run.ultimateCharge}%`,
    );
    ultimateAbility?.classList.toggle(
      "charged",
      g.run.ultimateCharge >= 100 && g.player.secondCd <= 0,
    );
    for (const action of ["dash", "skill", "skill2"] as const) {
      const cooldown =
        action === "dash"
          ? g.player.dashCd
          : action === "skill"
            ? g.player.skillCd
            : g.player.secondCd;
      const button = this.root.querySelector<HTMLButtonElement>(
        `.touch-actions [data-action="${action}"]`,
      )!;
      if (action !== "dash") {
        const slot = action === "skill" ? 0 : 1;
        const id = g.run.skills[slot];
        button.hidden = !id;
        button.querySelector("span")!.textContent = id
          ? skillById(id).name
          : "WAVE 1";
        button.title = id ? skillById(id).desc : "Desbloqueie durante a run";
        if (id && button.dataset.skillId !== id) {
          button.dataset.skillId = id;
          button.querySelector(".icon")!.outerHTML = icon(skillById(id).glyph);
        }
      }
      const ultimate = action === "skill2" && isUltimate(g.run.skills[1] ?? "");
      button.classList.toggle("ultimate-action", ultimate);
      button.style.setProperty("--ultimate-fill", `${g.run.ultimateCharge}%`);
      button.disabled =
        cooldown > 0 ||
        (ultimate && g.run.ultimateCharge < 100) ||
        g.intro > 0 ||
        g.phase !== "combat";
      const label = button.querySelector("small")!;
      label.textContent = ultimate
        ? g.run.ultimateCharge >= 100 && cooldown <= 0
          ? "ULT PRONTA"
          : `${Math.floor(g.run.ultimateCharge)}%`
        : cooldown > 0
          ? `${cooldown.toFixed(1)}s`
          : "Pronta";
      button.classList.toggle("available", !button.disabled);
    }
    this.hud.querySelector<HTMLElement>("#hp-meter")!.style.width =
      `${Math.max(0, g.player.hp / g.player.maxHp) * 100}%`;
    this.hud
      .querySelector<HTMLElement>("#reload-state")!
      .classList.toggle("ready", g.player.charge >= g.fireInterval);
    const boss = g.enemies.find((e) => e.kind === "boss");
    this.hud.querySelector<HTMLElement>("#boss-health")!.hidden = !boss;
    if (boss) {
      this.hud.querySelector<HTMLElement>("#boss-meter")!.style.width =
        `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
      text(
        "boss-phase",
        `${["", "I", "II", "III", "IV"][boss.phase]} / IV${boss.transition > 0 ? " · TRANSIÇÃO" : ""}`,
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
    const g = this.game;
    const seed = `<div class="seed-row"><label for="seed">SEED <input id="seed" aria-label="CÓDIGO DA RUN" maxlength="40" autocomplete="off" spellcheck="false" aria-describedby="seed-help"></label><button class="icon-button" data-action="random" aria-label="Gerar novo código">${icon("repeat")}</button><button class="text-button" data-action="daily">DIÁRIA</button></div><span id="seed-help" class="sr-only">Mesmo código e escolhas, mesmas ofertas.</span>`;
    return `<main class="arcade-menu ${mobile ? "mobile-menu" : "menu-layout"}"><div class="arcade-title"><span class="game-kicker">SURVIVE · EVOLVE · REPEAT</span><h1>ROGUE<span>COREBREAKER</span></h1><div class="boss-seals">${[1, 2, 3].map((n) => `<span>${icon("crown")}<b>${n}</b></span>`).join("")}</div></div><section class="run-intro" aria-label="Evolua durante a run"><div class="run-pilot">${pilotPortrait("ranger")}</div><div class="run-evolution"><span>${icon("target")}<small>SOBREVIVA</small></span>${icon("arrow")}<span>${icon("bolt")}<small>DESCUBRA PODERES</small></span>${icon("arrow")}<span>${icon("explosion")}<small>CRIE SUA BUILD</small></span></div></section><div class="launch-panel">${mobile ? `<details class="mobile-seed"><summary>${icon("coin")} SEED / DIÁRIA</summary>${seed}</details>` : seed}<button class="primary start-button" data-action="start" aria-label="Iniciar expedição">${icon("target")}<span>JOGAR</span>${icon("arrow")}</button><div class="arcade-records"><span>${icon("crown")} ${g.records.wins}</span><span>${icon("mark")} ${g.records.bestRoom}/12</span><button class="text-button" data-action="help" aria-label="Como jogar">${icon("book")} CONTROLES</button></div></div></main>`;
  }
  private rewardScreen() {
    const g = this.game,
      boss = g.run.room % 4 === 0;
    const ultimateDraft = g.run.offers.some((id) => id.startsWith("ultimate:"));
    const draft = g.run.offers.some((id) => id.startsWith("skill:"));
    const weaponDraft = g.run.room === 4;
    const relicDraft = g.run.room === 1;
    return `<section class="wide-dialog loot-screen ${draft ? "skill-draft" : ""}" role="dialog" aria-modal="true" aria-labelledby="screen-title"><div class="loot-banner"><span>${icon(boss ? "crown" : "skull")}</span><div><small>WAVE ${g.run.room.toString().padStart(2, "0")} CLEAR</small><h1 id="screen-title">${ultimateDraft ? "ULTIMATE DESPERTA" : relicDraft ? "PRIMEIRO FRAGMENTO" : weaponDraft ? "SEU DISPARO" : draft ? (g.run.room === 2 ? "NOVA HABILIDADE" : "EVOLUA SUA BUILD") : boss ? "GUARDIÃO ABATIDO" : "MUTAÇÃO!"}</h1></div><button class="icon-button" data-action="item-info" aria-label="Mostrar descrições das melhorias" aria-pressed="${this.itemDetails}">${icon("book")}</button></div>${ultimateDraft ? `<p class="draft-instruction"><kbd>E</kbd> Escolha sua ultimate. Ela começa carregada; acerte ataques para carregar novamente.</p>` : draft ? `<p class="draft-instruction"><kbd>Q</kbd> ${g.run.skills[0] ? `Nova habilidade substitui ${skillById(g.run.skills[0]).name}.` : "Escolha sua primeira habilidade."}</p>` : ""}${this.buildSummary()}<div class="reward-grid">${g.run.offers
      .map((id) => {
        const reward = REWARDS.find((r) => r.id === id)!,
          item = ITEM_VISUALS[id];
        const power = id.includes(":");
        const info = power ? powerInfo(id) : null;
        const elemental = /RAIO|VENENO/.test(reward.tag);
        const synergy = rewardSynergy(g.run, id);
        return `<button class="reward-card loot-card ${power ? "power-card" : ""} ${elemental ? "elemental-card" : ""}" style="--class-color:${reward.color}" data-action="reward" data-value="${id}" aria-label="${escape(reward.name)}. ${escape(reward.desc)}"><div class="loot-category">${reward.tag}</div>${power ? powerDiagram(id) : `<div class="loot-object">${icon(item.glyph)}</div>`}<div class="loot-stat"><strong>${item.value}</strong><span>${item.stat}</span></div><h2>${reward.name}</h2>${info ? `<span class="power-target">${info.where}</span><p class="power-description">${info.desc}</p><span class="power-trigger">${info.trigger}</span>` : `<span class="loot-hint">${item.hint}</span>`}${!power ? `<p class="item-description">${reward.desc}</p>` : ""}${synergy ? `<span class="synergy-hint">${synergy}</span>` : ""}<div class="loot-pips">${Array.from({ length: reward.max }, (_, i) => `<i class="${i <= (g.run.rewards[id] ?? 0) ? "lit" : ""}"></i>`).join("")}</div><span class="loot-select">EQUIPAR ${icon("arrow")}</span></button>`;
      })
      .join(
        "",
      )}</div><div class="loot-footer"><span>${icon("coin")} ${g.run.gold}</span>${boss ? `<span class="boss-bounty">${icon("heart")} +25% ${icon("repeat")} +1</span>` : ""}<button class="secondary" data-action="reroll" aria-label="Trocar ofertas" ${!g.run.rerolls || g.run.room === 1 ? "disabled" : ""}>${icon("repeat")} <b>${g.run.rerolls}</b></button></div></section>`;
  }
  private campScreen() {
    const g = this.game,
      boss = (g.run.room + 1) % 4 === 0;
    return `<section class="wide-dialog armory-screen" role="dialog" aria-modal="true" aria-labelledby="screen-title"><div class="loot-banner"><span>${icon("shield")}</span><div><small>CHECKPOINT ${g.run.room.toString().padStart(2, "0")}</small><h1 id="screen-title">ARSENAL</h1></div><span class="armory-gold">${icon("coin")} ${g.run.gold}</span></div>${this.buildSummary()}<div class="weapon-rack" aria-label="Armas desbloqueadas">${g.run.weapons.map((id) => `<button class="secondary ${g.run.weapon === id ? "selected" : ""}" data-action="weapon" data-value="${id}" aria-pressed="${g.run.weapon === id}">${icon(weaponById(id).glyph)} ${weaponById(id).name}</button>`).join("")}</div><div class="armory-body"><div class="hero-training"><div class="training-heading"><span>ATRIBUTOS DO HERÓI</span><small>${2 - g.run.purchases}/2 compras neste checkpoint · 3 níveis por atributo</small></div><div class="armory-items">${HERO_STATS.map(
      (stat) => {
        const rank = g.run.training[stat.id] ?? 0,
          cost = trainingCost(g.run, stat.id);
        return `<button class="shop-crate stat-crate" data-action="train" data-value="${stat.id}" aria-label="${stat.name}. ${stat.desc}. Nível ${rank} de ${TRAINING_CAP}. Custo ${cost} ouro." ${rank >= TRAINING_CAP || g.run.purchases >= 2 || g.run.gold < cost ? "disabled" : ""}><span class="crate-symbol">${icon(stat.glyph)}</span><strong>${stat.name}</strong><small>${stat.effect}</small><span class="training-pips" aria-hidden="true">${Array.from({ length: TRAINING_CAP }, (_, i) => `<i class="${i < rank ? "lit" : ""}"></i>`).join("")}</span><span class="crate-price">${rank >= TRAINING_CAP ? "MÁXIMO" : `${icon("coin")} ${cost}`}</span></button>`;
      },
    ).join(
      "",
    )}</div></div><aside class="loadout-snapshot"><div class="equipped-stats">${statChip("heart", `${Math.ceil(g.player.hp)}/${g.player.maxHp}`, "VIDA")}${statChip("target", g.player.damage.toFixed(0), "DANO")}${statChip("repeat", `${g.fireInterval.toFixed(2)}s`, "RECARGA")}</div><div class="equipped-skills">${g.run.skills.map((id, slot) => (id ? `<span title="${skillById(id).desc}"><kbd>${slot === 0 ? "Q" : "E"}</kbd>${icon(skillById(id).glyph)}${skillById(id).name}</span>` : "")).join("")}</div><div class="equipped-inventory">${Object.entries(
      g.run.rewards,
    )
      .filter(([id]) => !id.includes(":"))
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
      `<div class="result-medal">${icon(g.run.won ? "crown" : "skull")}</div><span class="game-kicker">${g.run.practice ? "LAB · SEM RECORDES" : g.run.won ? "CORE DESTROYED" : "RUN OVER"}</span><h1 id="screen-title">${g.run.won ? "VITÓRIA" : "DERROTA"}</h1><div class="result-stats"><div><strong>${g.run.kills}</strong><span>ABATES</span></div><div><strong>${g.peakCombo}</strong><span>SEQUÊNCIA</span></div><div><strong>${g.run.room}<small>/12</small></strong><span>WAVE</span></div><div><strong>${formatTime(g.run.elapsed)}</strong><span>TEMPO</span></div></div><div class="equipped-inventory result-inventory">${Object.entries(
        g.run.rewards,
      )
        .map(
          ([id, count]) =>
            `<span title="${REWARDS.find((r) => r.id === id)!.name}">${icon(ITEM_VISUALS[id].glyph)}<b>${count}</b></span>`,
        )
        .join(
          "",
        )}</div><div class="stack-actions"><button class="primary" data-action="retry" aria-label="Repetir código e caminho">${icon("repeat")} REPETIR</button><button class="secondary" data-action="menu" aria-label="Nova expedição">NOVA RUN ${icon("arrow")}</button></div><p class="result-seed">SEED <code>${escape(g.run.seed)}</code></p>`,
      "result-dialog",
    );
  }
  private buildSummary() {
    const g = this.game,
      e = buildElements(g.run);
    if (!e.storm && !e.toxin) return "";
    return `<div class="build-synergies" aria-label="Sinergias da build">${e.storm ? `<span class="storm">${icon("bolt")} RAIO <small>CARGAS → DESCARGAS</small><b>${g.run.reactions.overload + g.run.reactions.conduction}</b></span>` : ""}${e.toxin ? `<span class="toxin">${icon("toxin")} VENENO <small>${g.run.rewards.catalyst ? "DOSES → CATÁLISE" : "ACUMULE ATÉ 4 DOSES"}</small>${g.run.rewards.catalyst ? `<b>${g.run.reactions.catalysis}</b>` : ""}</span>` : ""}${g.run.rewards.electrolysis ? `<span>${icon("repeat")} ELETRÓLISE</span>` : ""}</div>`;
  }
  private powerScreen(id: string) {
    const info = powerInfo(id);
    return `<section class="dialog power-help" role="dialog" aria-modal="true" aria-label="Entender poder"><span class="game-kicker">${info.trigger}</span><h1>${info.name}</h1>${powerDiagram(id)}<strong class="power-target">${info.where}</strong><p>${info.desc}</p><small>${info.timing}</small><p class="guide-legend"><i></i> VOCÊ EM VERDE · INIMIGOS EM VERMELHO · PRÉVIA EM LOOP</p><button class="primary" data-action="close-power">ENTENDI ${icon("arrow")}</button></section>`;
  }
  private labScreen() {
    const g = this.game;
    const select = (id: string, label: string, options: string) =>
      `<label>${label}<select id="${id}">${options}</select></label>`;
    return `<section class="dialog lab-dialog" role="dialog" aria-modal="true" aria-label="Laboratório de gameplay"><div class="loot-banner"><span>${icon("flask")}</span><div><small>PLAYGROUND</small><h1>LABORATÓRIO</h1></div></div><p class="lab-note">Teste livre · não altera recordes · saltar inicia uma nova run.</p><div class="lab-grid">${select(
      "lab-state",
      "ESTADO",
      [
        ["combat", "Combate"],
        ["reward", "Escolha de build"],
        ["camp", "Arsenal"],
        ["result", "Resultado"],
      ]
        .map(([id, name]) => `<option value="${id}">${name}</option>`)
        .join(""),
    )}${select("lab-room", "ENCONTRO", Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === g.run.room ? "selected" : ""}>${(i + 1) % 4 === 0 ? `BOSS ${Math.ceil((i + 1) / 4)}` : `WAVE ${i + 1}`}</option>`).join(""))}${select("lab-phase", "FASE DO BOSS", [1, 2, 3, 4].map((n) => `<option value="${n}">${["", "I", "II", "III", "IV"][n]}</option>`).join(""))}${select(
      "lab-build",
      "ESTILO",
      [
        ["control", "Controle · poço + ultimate elétrica"],
        ["gunner", "Atirador · rajada + cataclismo"],
        ["brawler", "Briga · pisada + cataclismo"],
        ["trickster", "Truques · isca + eclosão"],
        ["lightning", "Raio · cargas e para-raios"],
        ["toxin", "Veneno · doses e catálise"],
        ["hybrid", "Híbrida · eletrólise e circuito"],
        ["fresh", "Sem perks · kit básico"],
      ]
        .map(([id, name]) => `<option value="${id}">${name}</option>`)
        .join(""),
    )}${select(
      "lab-pilot",
      "PILOTO",
      Object.entries(CLASSES)
        .map(
          ([id, c]) =>
            `<option value="${id}" ${id === g.run.classId ? "selected" : ""}>${c.name}</option>`,
        )
        .join(""),
    )}</div><button class="primary" data-action="lab-jump">${icon("arrow")} SALTAR PARA O ESTADO</button>${
      g.run.practice
        ? `<div class="lab-current"><span class="game-kicker">RUN DE PRÁTICA · WAVE ${g.run.room}</span><div class="lab-grid">${([0, 1] as const).map((slot) => `<label>${slot === 0 ? "Q" : "E"}<select data-lab-slot="${slot}" aria-label="Habilidade ${slot === 0 ? "Q" : "E"}"><option value="" ${!g.run.skills[slot] ? "selected" : ""}>VAZIO</option>${(slot === 0 ? SKILLS : ULTIMATES).map((s) => `<option value="${s.id}" ${g.run.skills[slot] === s.id ? "selected" : ""} ${g.run.skills[1 - slot] === s.id ? "disabled" : ""}>${s.name}</option>`).join("")}</select></label>`).join("")}</div><div class="lab-grid"><button class="secondary" data-action="lab-god" aria-pressed="${g.labGod}">${icon("shield")} INVENCÍVEL ${g.labGod ? "ON" : "OFF"}</button>${select("lab-weapon", "ATAQUE AUTOMÁTICO", WEAPONS.map((w) => `<option value="${w.id}" ${g.run.weapon === w.id ? "selected" : ""}>${w.name}</option>`).join(""))}${select("lab-speed", "RITMO", [0.5, 1, 2, 3].map((n) => `<option value="${n}" ${g.labSpeed === n ? "selected" : ""}>${n}×</option>`).join(""))}</div><details><summary>ADICIONAR PERKS</summary><div class="lab-perks">${REWARDS.filter(
            (r) => !r.id.includes(":"),
          )
            .map(
              (r) =>
                `<button class="secondary" data-action="lab-perk" data-value="${r.id}" title="${r.desc}" ${(g.run.rewards[r.id] ?? 0) >= r.max ? "disabled" : ""}>${icon(ITEM_VISUALS[r.id].glyph)} ${r.name}</button>`,
            )
            .join(
              "",
            )}</div></details><button class="secondary" data-action="lab-clear">${icon("skull")} LIMPAR WAVE</button></div>`
        : ""
    }<button class="secondary" data-action="lab-close">VOLTAR</button></section>`;
  }
  private settingsScreen() {
    return this.dialog(
      `<span class="emblem">${icon("gear")}</span><h1>CONFIGURAÇÕES</h1><div class="settings-row"><label for="interface-mode">INTERFACE</label><select id="interface-mode" aria-label="Interface"><option value="auto">Auto</option><option value="mobile">Celular</option><option value="desktop">Desktop</option></select></div><button class="secondary effects-choice" data-action="effects">${icon("explosion")} EFEITOS <strong>${this.game.reducedMotion ? "REDUZIDOS" : "COMPLETOS"}</strong></button><button class="secondary" data-action="lab">${icon("flask")} LABORATÓRIO</button><button class="primary" data-action="close-settings" aria-label="Fechar configurações">VOLTAR ${icon("arrow")}</button>`,
      "settings-dialog",
    );
  }
  private helpScreen() {
    const powers = `<div class="build-help-links"><small>ENTENDA SEUS ATAQUES</small>${[`weapon:${this.game.run.weapon}`, ...this.game.run.skills.filter((id): id is string => !!id).map((id) => `${isUltimate(id) ? "ultimate" : "skill"}:${id}`)].map((id) => `<button class="secondary" data-action="inspect-power" data-value="${id}">${icon(powerInfo(id).glyph)} ${powerInfo(id).name}</button>`).join("")}</div>`;
    if (this.layout.mode === "mobile")
      return this.dialog(
        `${powers}<span class="eyebrow">FEITO PARA OS SEUS POLEGARES</span><h1 id="screen-title">Toque. Mova.<br><em>Encontre espaço.</em></h1><div class="help-list mobile-help"><div>${icon("target")}<p><b>Arraste o controle esquerdo para mover.</b> Solte o dedo para parar e disparar automaticamente no inimigo mais próximo.</p></div><div>${icon("arrow")}<p><b>Toque em Esquiva para escapar.</b> Funciona enquanto você move com o outro dedo. A proteção é breve; a recarga aparece no botão.</p></div><div>${icon("bolt")}<p><b>Toque em Habilidade para abrir espaço.</b> Você começa sem habilidades: receba uma relíquia na wave 1, Q após a wave 2 e uma ultimate após o segundo boss, na wave 8. A primeira arma alternativa chega após o primeiro boss. O botão ilumina quando estiver pronto.</p></div><div>${icon("crown")}<p><b>Evite os círculos anunciados pelos chefes.</b> A arena inteira fica visível; os controles têm uma área própria fora do campo de combate.</p></div><div>${icon("pause")}<p><b>Pause pelo botão no topo.</b> Girar a tela ou sair da aba também pausa. Funciona em pé e deitado.</p></div></div><p class="help-note">Cada run começa do zero. Só seus recordes ficam salvos. Você pode trocar entre a interface de celular e desktop nas configurações da engrenagem.</p><button class="primary" data-action="close-help">Entendi ${icon("arrow")}</button>`,
        "help-dialog",
      );
    return this.dialog(
      `${powers}<span class="eyebrow">O BÁSICO, SEM MISTÉRIO</span><h1 id="screen-title">Jogue no seu <em>ritmo.</em></h1><div class="help-list"><div><kbd>WASD / ↑↓←→</kbd><p><b>Mova-se para escapar.</b> O personagem mira automaticamente no inimigo mais próximo.</p></div><div>${icon("target")}<p><b>Pare para disparar.</b> O contorno mostra a recarga. Em movimento ela avança a 65% da velocidade.</p></div><div><kbd>ESPAÇO</kbd><p><b>Esquive com invulnerabilidade.</b> Use uma direção ou repita a última. Recarga de 2,6 segundos.</p></div><div><kbd>Q / E</kbd><p><b>Combine suas habilidades.</b> Você começa sem habilidades. Na wave 1, escolha uma relíquia; após a wave 2, equipe Q. A ultimate E chega após o segundo boss, na wave 8, e recarrega ao acertar ataques. Novas armas chegam após o primeiro boss. Elas também funcionam em movimento.</p></div><div>${icon("crown")}<p><b>Três atos. Três guardiões.</b> Escolha melhorias entre encontros. Chefes têm quatro fases; saia dos círculos antes de explodirem.</p></div><div><kbd>ESC</kbd><p><b>Pause quando precisar.</b> Trocar de aba também pausa. No celular, use o controle de movimento e os botões na arena.</p></div></div><p class="help-note">Combo alto consome a barra mais rápido; mover acelera a queda. Acertos e abates renovam a barra. Mais combo aumenta a chance de ouro extra, até 40%. No arsenal, compre até dois níveis de atributos por checkpoint. Cada atributo tem três níveis e vale só nesta run. F2 ou o frasco abre o laboratório, com runs de prática sem recordes.</p><p class="help-note">Runs não continuam após fechar a página. Só os recordes ficam salvos. A diária usa a data UTC; caminhos diferentes podem ter dificuldades diferentes.</p><button class="primary" data-action="close-help">Entendi ${icon("arrow")}</button>`,
      "help-dialog",
    );
  }
  private dialog(content: string, className = "") {
    return `<section class="dialog ${className}" role="dialog" aria-modal="true" aria-label="${this.settings ? "Configurações" : this.help ? "Como jogar" : this.game.phase === "paused" ? "Jogo pausado" : "Resultado da run"}">${content}</section>`;
  }
}
