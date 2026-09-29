import catalog from "./catalog.json";

export type Tags = {
  minPlayers: number | null; maxPlayers: number | null;
  idealMin: number | null; idealMax: number | null;
  minTime: number | null; maxTime: number | null;
  moods: string[]; strongMoods: string[];
  interactions: string[]; strongInteractions: string[];
  interests: string[]; groupTypes: string[];
  teachEffort: number; partyEnergy: number; conflictLevel: number;
  family: string; isExpansion: boolean;
  excluded: null | "low-confidence" | "mature" | "solo-activity";
};

export type Game = {
  id: string;
  gameTitle: string;
  inventoryName: string;
  inventoryNames: string[];
  alias: string | null;
  quantity: number;
  theme: string;
  playerCount: string;
  idealPlayerCount: string;
  estimatedPlaytime: string;
  difficulty: number | null;
  bggComplexity: number | null;
  setupTime: string;
  tableFootprint: string;
  staffTeachMinutes: number | null;
  vibeAndConflict: string;
  targetAudience: string;
  minimumAge: number | null;
  dataConfidence: "high" | "medium" | "low";
  notes: string;
  description: string;
  tags: Tags;
};

/** Full catalogue, generated from playroom-games-dataset.json (single source of truth). */
export const CATALOG = catalog as Game[];

/** Games eligible for normal group recommendations. */
export const GAMES = CATALOG.filter((g) => !g.tags.excluded && !g.tags.isExpansion && g.tags.minPlayers != null);

export const DIFFICULTY_LABEL = ["", "Very easy", "Easy", "Gateway strategy", "Challenging", "Heavy"];
export const difficultyLabel = (d: number | null) => (d ? DIFFICULTY_LABEL[d] : "Ask a Game Master");

export const expansionFor = (g: Game) => CATALOG.find((x) => x.tags.isExpansion && x.tags.family === g.tags.family);
