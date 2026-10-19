import { describe, expect, it } from "vitest";
import {
  createRun,
  createPlayer,
  randomFromSeed,
  rewardOffers,
  applyReward,
  advanceRoom,
  roomComposition,
  finishRecords,
  emptyRecords,
  REWARDS,
} from "../src/game/model";

describe("run rules", () => {
  it("has three bosses and a finite twelve-room route", () => {
    const run = createRun("TEST", "ranger");
    const bosses: number[] = [];
    do {
      expect(run.act).toBe(Math.ceil(run.room / 4));
      if (roomComposition(run.room).includes("boss")) bosses.push(run.room);
    } while (advanceRoom(run));
    expect(bosses).toEqual([4, 8, 12]);
    expect(run.room).toBe(12);
    expect(advanceRoom(run)).toBe(false);
  });
  it("replays seeds and samples three distinct eligible rewards", () => {
    const a = randomFromSeed("SAME"),
      b = randomFromSeed("SAME");
    expect(Array.from({ length: 50 }, a)).toEqual(
      Array.from({ length: 50 }, b),
    );
    const run = createRun("TEST", "arcanist");
    run.rewards.double = 1;
    for (let i = 0; i < 100; i++) {
      const offers = rewardOffers(run, a);
      expect(new Set(offers).size).toBe(3);
      expect(offers).not.toContain("double");
    }
  });
  it("rerolls prefer new offers and handles exhausted pools", () => {
    const run = createRun("TEST", "ranger");
    run.room = 4;
    const random = randomFromSeed("TEST");
    const offers = rewardOffers(run, random);
    expect(
      rewardOffers(run, random, offers).some((id) => offers.includes(id)),
    ).toBe(false);
    for (const reward of REWARDS) run.rewards[reward.id] = reward.max;
    expect(rewardOffers(run, random)).toEqual([]);
    run.rewards.anchor--;
    expect(rewardOffers(run, random)).toEqual(["anchor"]);
  });
  it("enforces upgrade caps and heals without exceeding maximum health", () => {
    const run = createRun("TEST", "colossus"),
      player = createPlayer("colossus");
    player.hp = 130;
    expect(applyReward(run, player, "health")).toBe(true);
    expect(player.maxHp).toBe(165);
    expect(player.hp).toBe(155);
    for (let i = 0; i < 10; i++) applyReward(run, player, "health");
    expect(run.rewards.health).toBe(4);
    expect(player.maxHp).toBe(240);
    expect(applyReward(run, player, "unknown")).toBe(false);
  });
  it("creates isolated runs and persists records without transferring power", () => {
    const first = createRun("A", "ranger");
    first.won = true;
    first.room = 12;
    first.elapsed = 200;
    first.rewards.power = 4;
    const records = finishRecords(emptyRecords(), first);
    const second = createRun("B", "ranger");
    expect(second.rewards).toEqual({});
    expect(second.gold).toBe(0);
    expect(records).toEqual({ runs: 1, wins: 1, bestRoom: 12, bestTime: 200 });
    second.room = 3;
    second.elapsed = 20;
    expect(finishRecords(records, second).bestTime).toBe(200);
  });
});
