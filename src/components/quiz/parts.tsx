import { Brain, Dices, Hand, Leaf, PenTool, Search, Spade, Type, Castle, Users, Clock, Gauge, AlertTriangle, ChevronDown, GraduationCap, LayoutGrid, Sparkle, Heart } from "lucide-react";
import { useState } from "react";
import { difficultyLabel, expansionFor, type Game } from "@/lib/games";
import type { Option } from "@/lib/quiz";
import type { Scored } from "@/lib/recommend";
import { cn } from "@/lib/utils";

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} className="w-full">
      <div className="mb-1.5 flex justify-between text-sm font-bold text-muted-foreground">
        <span>Question {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function AnswerCard({ option, selected, onClick }: { option: Option; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 bg-card p-5 text-left shadow-card transition-all active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
        selected ? "border-primary bg-accent" : "border-transparent hover:border-border",
      )}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-2xl" aria-hidden>{option.emoji}</span>
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-tight">{option.label}</span>
        {option.hint && <span className="mt-1 block text-[15px] leading-snug text-muted-foreground">{option.hint}</span>}
      </span>
      <span className={cn("ml-auto h-6 w-6 shrink-0 rounded-full border-2", selected ? "border-primary bg-primary" : "border-border")} aria-hidden />
    </button>
  );
}

const ICONS: Record<string, typeof Dices> = {
  words: Type, mystery: Search, strategy: Castle, cards: Spade, creative: PenTool,
  dexterity: Hand, adventure: Leaf, classic: Brain,
};
const GRADS = ["bg-primary", "bg-teal", "bg-secondary", "bg-foreground"];

export function GameCover({ game, large }: { game: Game; large?: boolean }) {
  const h = [...game.gameTitle].reduce((s, c) => s + c.charCodeAt(0), 0);
  const Icon = ICONS[game.tags.interests[0] ?? ""] ?? Dices;
  return (
    <div className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-2xl", GRADS[h % GRADS.length], large ? "h-40 w-full" : "h-24 w-24")} aria-hidden>
      <Icon className={cn("relative text-primary-foreground", large ? "h-16 w-16" : "h-10 w-10")} strokeWidth={2.2} />
      {large && <span className="absolute bottom-3 left-4 right-4 truncate font-display text-xl font-bold text-primary-foreground">{game.theme}</span>}
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof Dices; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5"><Icon className="h-4 w-4" />{children}</span>;
}

function Meta({ game }: { game: Game }) {
  return (
    <div className="flex flex-wrap gap-2 text-sm font-bold">
      <Chip icon={Users}>{game.playerCount} players</Chip>
      <Chip icon={Heart}>Best: {game.idealPlayerCount}</Chip>
      <Chip icon={Clock}>{game.estimatedPlaytime}</Chip>
      <Chip icon={Gauge}>{difficultyLabel(game.difficulty)}</Chip>
      {game.staffTeachMinutes != null && <Chip icon={GraduationCap}>~{game.staffTeachMinutes} min to learn</Chip>}
      <Chip icon={LayoutGrid}>{game.tableFootprint} table</Chip>
      <Chip icon={Sparkle}>{game.vibeAndConflict}</Chip>
    </div>
  );
}

const CONF_LABEL = { high: "Top match", good: "Good alternative", fallback: "Worth asking about" } as const;

export function ResultCard({ result, best, differs, delay = 0 }: { result: Scored; best?: boolean; differs?: string; delay?: number }) {
  const [open, setOpen] = useState(!!best);
  const [details, setDetails] = useState(false);
  const g = result.game;
  const exp = g.tags.family === "onitama" ? expansionFor(g) : undefined;
  return (
    <article className="animate-pop-in overflow-hidden rounded-3xl bg-card p-5 shadow-card" style={{ animationDelay: `${delay}ms` }}>
      {best ? <GameCover game={g} large /> : (
        <div className="flex items-center gap-4">
          <GameCover game={g} />
          <div className="min-w-0">
            <h3 className="text-2xl font-bold leading-tight">{g.gameTitle}</h3>
            <p className="text-sm font-semibold text-muted-foreground">{g.theme}</p>
            {differs && <p className="mt-1 font-semibold text-teal">{differs}</p>}
          </div>
        </div>
      )}
      {best && <h3 className="mt-4 text-3xl font-bold">{g.gameTitle}</h3>}
      {best && <p className="font-semibold text-muted-foreground">{g.theme}</p>}
      <p className={cn("mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide", result.confidence === "fallback" ? "bg-warning text-warning-foreground" : "bg-accent")}>{CONF_LABEL[result.confidence]}</p>
      <div className="mt-3"><Meta game={g} /></div>
      {result.warnings.map((w) => (
        <p key={w} className="mt-3 flex gap-2 rounded-xl bg-warning p-3 text-sm font-semibold text-warning-foreground"><AlertTriangle className="h-5 w-5 shrink-0" />{w}</p>
      ))}
      <ul className="mt-4 space-y-2">
        {result.reasons.map((r) => (
          <li key={r} className="flex gap-2 font-semibold"><span className="text-primary" aria-hidden>★</span>{r}</li>
        ))}
      </ul>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-3 flex min-h-11 items-center gap-1 font-bold text-primary">
        How it plays <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="animate-pop-in rounded-2xl bg-muted p-4">
          <p>{g.description}</p>
          {exp && <p className="mt-2 text-sm font-semibold">Already know Onitama? Ask for the {exp.gameTitle} expansion.</p>}
        </div>
      )}
      <button type="button" onClick={() => setDetails(!details)} aria-expanded={details} className="flex min-h-11 items-center gap-1 text-sm font-bold text-muted-foreground">
        Game details <ChevronDown className={cn("h-4 w-4 transition-transform", details && "rotate-180")} />
      </button>
      {details && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-2xl bg-muted p-4 text-sm">
          {g.alias && <><dt className="text-muted-foreground">Also known as</dt><dd>{g.alias}</dd></>}
          <dt className="text-muted-foreground">Ages</dt><dd>{g.minimumAge ?? "?"}+</dd>
          <dt className="text-muted-foreground">Setup</dt><dd>{g.setupTime}</dd>
          <dt className="text-muted-foreground">BGG complexity</dt><dd>{g.bggComplexity ?? "Not listed"}</dd>
          <dt className="text-muted-foreground">Good for</dt><dd>{g.targetAudience}</dd>
        </dl>
      )}
    </article>
  );
}
