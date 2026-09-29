import { GAMES, type Game } from "./games";
import type { Answers } from "./quiz";

export const W = { players: 30, age: 20, time: 15, mood: 10, interaction: 10, interest: 5, learning: 5, teach: 5 };

const PLAYERS: Record<string, [number, number]> = { "2": [2, 2], "3-4": [3, 4], "5-6": [5, 6], "7-8": [7, 8], "9+": [9, 10] };
const TIME: Record<string, [number, number, string]> = {
  "10": [0, 15, "under-15-minute"], "25": [15, 30, "30-minute"], "45": [30, 60, "hour-long"],
  "75": [60, 90, "60–90 minute"], "120": [90, 240, "long"],
};
const LEARN: Record<string, { maxDiff: number; maxTeach: number }> = {
  "1": { maxDiff: 1, maxTeach: 5 }, "2": { maxDiff: 2, maxTeach: 10 }, "3": { maxDiff: 3, maxTeach: 25 },
};
const NOT_IMMEDIATE = ["Wingspan", "7 Wonders", "Catan", "Pandemic", "Treasure Island", "Clue Conspiracy", "Mahjong Go!"];
const NEVER_QUICK = ["Risk", "Monopoly: Deluxe Edition", "Monopoly: Electronic Banking", "Catan", "The Game of Life"];
const MOOD_PHRASE: Record<string, string> = {
  silly: "laugh and be silly", relax: "relax and chat", compete: "get competitive",
  think: "think and strategize", mystery: "solve a mystery together", energetic: "try something energetic",
};
const INT_PHRASE: Record<string, string> = {
  coop: "work together as one team", solo: "play everyone for themselves", teams: "split into small teams",
  bluff: "bluff and surprise each other", friendly: "keep it easy and friendly",
};
const INTEREST_PHRASE: Record<string, string> = {
  words: "words and trivia", mystery: "mystery and deduction", strategy: "strategy and building",
  cards: "fast cards and lucky moments", creative: "drawing and creativity", dexterity: "hands-on physical challenges",
  adventure: "adventure and nature", classic: "classic and abstract games",
};
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const FOOT: Record<string, number> = { Small: 0, Medium: 1, Large: 2, Unknown: 3 };
const CONF: Record<string, number> = { high: 0, medium: 1, low: 2 };

export type Confidence = "high" | "good" | "fallback";
export type Scored = {
  game: Game;
  score: number;
  breakdown: Record<keyof typeof W | "penalty", number>;
  confidence: Confidence;
  prefHits: number;
  playerGap: number;
  idealMatch: boolean;
  warnings: string[];
  reasons: string[];
};

export function scoreGame(g: Game, a: Answers): Scored | null {
  const t = g.tags;
  const b = { players: 0, age: 0, time: 0, mood: 0, interaction: 0, interest: 0, learning: 0, teach: 0, penalty: 0 };
  const warnings: string[] = [];
  const reasons: { p: number; text: string }[] = [];

  // Age — hard safety limit: more than one year above the youngest is never recommended
  const youngest = +(a.youngest ?? 18);
  const minAge = g.minimumAge ?? 0;
  if (minAge > youngest + 1) return null;
  if (minAge <= youngest) b.age = W.age;
  else { b.age = 4; b.penalty -= 15; warnings.push(`Recommended for ages ${minAge}+ — your youngest player may need a little help.`); }

  // Players
  const [lo, hi] = PLAYERS[a.players ?? "3-4"] ?? [3, 4];
  const min = t.minPlayers!, max = t.maxPlayers!;
  const gap = lo < min ? min - lo : hi > max ? hi - max : 0;
  const idealMatch = t.idealMin != null && t.idealMin <= hi && (t.idealMax ?? t.idealMin) >= lo;
  if (gap === 0) b.players = idealMatch ? W.players : 22;
  else if (gap === 1) b.players = 4;
  if (gap > 0) warnings.push(`Best with ${g.idealPlayerCount.replace(" players", "")} players—ask a Game Master whether this can work for your group.`);
  const groupWord = a.players === "2" ? "the two of you" : a.players === "9+" ? "your big group" : `your group of ${(PLAYERS[a.players ?? ""] ?? [3, 4]).map((n) => NUM[n]).join(" or ")}`;
  if (gap === 0) reasons.push({ p: idealMatch ? 9 : 5, text: `Works well for ${groupWord}.` });

  // Time
  const [tlo, thi, tword] = TIME[a.time ?? "45"] ?? TIME["45"]!;
  const gmin = t.minTime ?? 30, gmax = t.maxTime ?? gmin;
  let timeFit = false;
  if (gmax <= thi) { b.time = gmax >= tlo * 0.5 ? W.time : 11; timeFit = true; }
  else if (gmin <= thi) { b.time = 9; timeFit = true; }
  else if (gmin <= thi + 15) b.time = 4;
  else warnings.push(`Usually takes ${g.estimatedPlaytime} — longer than the time you picked.`);
  if (b.time >= 11 && !NEVER_QUICK.includes(g.gameTitle)) reasons.push({ p: 7, text: `Fits your ${tword} visit.` });

  // Mood
  let prefHits = 0;
  if (a.mood && t.strongMoods.includes(a.mood)) { b.mood = W.mood; prefHits++; }
  else if (a.mood && t.moods.includes(a.mood)) { b.mood = 6; prefHits++; }

  // Interaction
  if (a.interaction === "any") b.interaction = 7;
  else if (a.interaction && t.strongInteractions.includes(a.interaction)) { b.interaction = W.interaction; prefHits++; }
  else if (a.interaction && t.interactions.includes(a.interaction)) { b.interaction = 6; prefHits++; }
  if (a.mood === "mystery" && a.interaction === "coop" && !t.interactions.includes("coop")) b.penalty -= 3;

  const moodHit = b.mood > 0, intHit = b.interaction >= 6 && a.interaction !== "any";
  if (moodHit && intHit) reasons.push({ p: 10, text: `Matches your group’s choice to ${MOOD_PHRASE[a.mood!]} and ${INT_PHRASE[a.interaction!]}.` });
  else if (moodHit) reasons.push({ p: 8, text: `Great when you want to ${MOOD_PHRASE[a.mood!]}.` });
  else if (intHit) reasons.push({ p: 8, text: `Lets you ${INT_PHRASE[a.interaction!]}.` });

  // Interests
  const ints = a.interests ?? [];
  const hit = ints.filter((i) => t.interests.includes(i));
  if (ints.length) b.interest = (W.interest * hit.length) / ints.length;
  if (hit.length) { prefHits++; reasons.push({ p: 6, text: `Matches your interest in ${INTEREST_PHRASE[hit[0]!]}.` }); }

  // Learning effort & teach time
  const L = LEARN[a.learning ?? "2"] ?? LEARN["2"]!;
  const d = g.difficulty ?? 3, teach = g.staffTeachMinutes ?? 15;
  if (d <= L.maxDiff) b.learning = W.learning;
  else b.penalty -= 8 * (d - L.maxDiff);
  if (teach <= L.maxTeach) b.teach = W.teach;
  else if (teach <= L.maxTeach * 1.6) b.teach = 2;
  else b.penalty -= 4;
  if (a.learning === "1" && NOT_IMMEDIATE.includes(g.gameTitle)) b.penalty -= 30;
  if (d <= 2 && teach <= L.maxTeach) reasons.push({ p: 6, text: `Easy to learn—the Game Master can explain it in about ${NUM[teach] ?? teach} minutes.` });
  else if (teach <= L.maxTeach) reasons.push({ p: 4, text: `A Game Master can teach it in about ${teach} minutes.` });

  // Group type
  if ((a.group === "family" || a.group === "kids") && t.groupTypes.includes("family") && youngest < 13)
    reasons.push({ p: 5, text: "A good fit for families with younger players." });

  const score = Math.max(0, Object.values(b).reduce((s, v) => s + v, 0));
  const confidence: Confidence =
    gap > 0 || !timeFit ? "fallback" : minAge <= youngest && prefHits >= 2 ? "high" : "good";

  return {
    game: g, score, breakdown: b, confidence, prefHits, playerGap: gap, idealMatch, warnings,
    reasons: reasons.sort((x, y) => y.p - x.p).map((r) => r.text).slice(0, 3),
  };
}

function tieBreak(x: Scored, y: Scored) {
  if (Math.abs(x.score - y.score) >= 2) return y.score - x.score;
  return (
    x.playerGap - y.playerGap ||
    Number(y.idealMatch) - Number(x.idealMatch) ||
    (x.game.staffTeachMinutes ?? 99) - (y.game.staffTeachMinutes ?? 99) ||
    CONF[x.game.dataConfidence]! - CONF[y.game.dataConfidence]! ||
    FOOT[x.game.tableFootprint]! - FOOT[y.game.tableFootprint]! ||
    (x.game.difficulty ?? 9) - (y.game.difficulty ?? 9) ||
    y.score - x.score
  );
}

/** Ranked list, one game per franchise/alias family. Out-of-range games appear only if fewer than 3 compatible. */
export function recommend(a: Answers): Scored[] {
  const all = GAMES.map((g) => scoreGame(g, a)).filter((s): s is Scored => !!s).sort(tieBreak);
  const seen = new Set<string>();
  const unique = all.filter((s) => (seen.has(s.game.tags.family) ? false : (seen.add(s.game.tags.family), true)));
  const ok = unique.filter((s) => s.playerGap === 0);
  const ranked = ok.length >= 3 ? ok : [...ok, ...unique.filter((s) => s.playerGap > 0)];
  if (import.meta.env.DEV) console.table(ranked.slice(0, 8).map((s) => ({ game: s.game.gameTitle, score: s.score.toFixed(1), conf: s.confidence, ...s.breakdown })));
  return ranked;
}

/** Best fit + easier/faster alternative + deeper/different alternative. */
export function pickTrio(ranked: Scored[], offset = 0): Scored[] {
  if (ranked.length <= 3) return ranked;
  const start = (offset * 3) % Math.max(1, ranked.length - 2);
  const pool = ranked.slice(start);
  const best = pool[0]!;
  const bg = best.game;
  const cand = pool.slice(1);
  const close = (x: Scored) => x.score >= best.score - 12;
  const newTheme = (x: Scored, ...ys: Scored[]) => ys.every((y) => y.game.theme !== x.game.theme);
  const lighter = (x: Scored) => (x.game.tags.maxTime ?? 0) < (bg.tags.maxTime ?? 0) || (x.game.difficulty ?? 3) < (bg.difficulty ?? 3);
  const easier = cand.find((x) => close(x) && newTheme(x, best) && lighter(x)) ?? cand.find((x) => newTheme(x, best)) ?? cand[0]!;
  const others = cand.filter((x) => x !== easier && newTheme(x, best, easier));
  const deeper =
    others.find((x) => close(x) && (x.game.difficulty ?? 3) > (bg.difficulty ?? 3)) ??
    others.find((x) => close(x) && x.game.vibeAndConflict !== bg.vibeAndConflict) ?? others[0] ?? cand.find((x) => x !== easier)!;
  return [best, easier, deeper];
}

export function howItDiffers(alt: Game, best: Game): string {
  const at = alt.tags.maxTime ?? 0, bt = best.tags.maxTime ?? 0;
  const ad = alt.difficulty ?? 3, bd = best.difficulty ?? 3;
  if (ad < bd) return `Choose this if you want something easier to pick up — about ${alt.staffTeachMinutes} minutes to learn.`;
  if (at < bt * 0.7 && !["Risk", "Catan"].includes(alt.gameTitle)) return `Choose this for a quicker game — around ${alt.estimatedPlaytime}.`;
  if (ad > bd) return "Choose this if your group wants a little more depth and strategy.";
  if (at > bt * 1.4) return `Choose this if you want a longer game to settle into — around ${alt.estimatedPlaytime}.`;
  if (alt.tags.interactions.includes("coop") && !best.tags.interactions.includes("coop")) return "Choose this if you’d rather work together than against each other.";
  if (alt.tags.interactions.includes("bluff") && !best.tags.interactions.includes("bluff")) return "Choose this if you enjoy bluffing and keeping secrets.";
  if (alt.tags.interests.includes("dexterity") && !best.tags.interests.includes("dexterity")) return "Choose this if you want something more hands-on and physical.";
  if (alt.tags.interests.includes("words") && !best.tags.interests.includes("words")) return "Choose this if your group loves talking and wordplay.";
  if (alt.tags.partyEnergy > best.tags.partyEnergy) return "Choose this for a louder, more energetic table.";
  if (alt.tags.partyEnergy < best.tags.partyEnergy) return "Choose this for a calmer game with more room to chat.";
  return `Choose this for a different feel — ${alt.vibeAndConflict.toLowerCase()}.`;
}
