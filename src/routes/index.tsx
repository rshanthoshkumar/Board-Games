import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, Sparkles, PartyPopper, X } from "lucide-react";
import hero from "@/assets/hero-table.jpg";
import { QUESTIONS, type Answers } from "@/lib/quiz";
import { recommend, pickTrio, howItDiffers } from "@/lib/recommend";
import { AnswerCard, ProgressBar, ResultCard } from "@/components/quiz/parts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Peakon — Find your perfect board game" },
      { name: "description", content: "Answer 8 quick questions and get board games your whole group will enjoy at The Playroom café, Salem." },
      { property: "og:title", content: "Peakon — Find your perfect board game" },
      { property: "og:description", content: "8 quick questions, 3 personal game picks, and a Game Master to teach you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type State = { screen: "home" | "quiz" | "results"; step: number; answers: Answers; offset: number };
const INIT: State = { screen: "home", step: 0, answers: {}, offset: 0 };
const KEY = "peakon-quiz";

const btnPrimary = "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground shadow-pop transition hover:brightness-105 active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40";
const btnGhost = "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-card px-4 font-bold shadow-card transition hover:bg-muted";

function Index() {
  const [s, setS] = useState<State>(INIT);
  const [called, setCalled] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(s)); window.scrollTo(0, 0); }, [s]);

  const restart = () => { setS(INIT); setCalled(false); };

  if (s.screen === "home") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <p className="font-display text-xl font-bold text-primary">Peakon <span className="text-muted-foreground">· The Playroom</span></p>
        <img src={hero} alt="Friends laughing around a café table playing a board game" width={1280} height={960} className="mt-6 rounded-3xl shadow-card" />
        <h1 className="mt-8 text-4xl font-bold leading-tight">Let’s find your perfect game</h1>
        <p className="mt-3 text-lg">Answer 8 quick questions and we’ll suggest games your whole group can enjoy.</p>
        <div className="mt-auto pt-8">
          <button className={btnPrimary} onClick={() => setS({ ...INIT, screen: "quiz" })}><Sparkles className="h-5 w-5" />Find Our Game</button>
          <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">Takes about one minute. No board-game knowledge needed.</p>
        </div>
      </main>
    );
  }

  if (s.screen === "quiz") {
    const q = QUESTIONS[s.step]!;
    const val = s.answers[q.key];
    const set = (v: string) => {
      if (q.multi) {
        const cur = (val as string[] | undefined) ?? [];
        const next = cur.includes(v) ? cur.filter((x) => x !== v) : cur.length >= q.multi ? [...cur.slice(1), v] : [...cur, v];
        setS({ ...s, answers: { ...s.answers, [q.key]: next } });
      } else {
        const answers = { ...s.answers, [q.key]: v };
        setTimeout(() => setS((p) => ({ ...p, answers, ...(p.step < QUESTIONS.length - 1 ? { step: p.step + 1 } : { screen: "results", offset: 0 }) })), 220);
        setS({ ...s, answers });
      }
    };
    const next = () => setS(s.step < QUESTIONS.length - 1 ? { ...s, step: s.step + 1 } : { ...s, screen: "results", offset: 0 });
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
        <div className="mb-5 flex items-center justify-between">
          <button className={btnGhost} onClick={() => (s.step === 0 ? setS(INIT) : setS({ ...s, step: s.step - 1 }))}><ArrowLeft className="h-5 w-5" />Back</button>
          <button className={btnGhost} onClick={restart}><RotateCcw className="h-5 w-5" />Restart</button>
        </div>
        <ProgressBar step={s.step + 1} total={QUESTIONS.length} />
        <section key={s.step} className="animate-slide-in mt-8">
          <h1 className="text-3xl font-bold leading-tight">{q.title}</h1>
          {q.multi && <p className="mt-2 font-semibold text-muted-foreground">Pick up to {q.multi}.</p>}
          <div className="mt-6 space-y-3">
            {q.options.map((o) => (
              <AnswerCard key={o.value} option={o} selected={Array.isArray(val) ? val.includes(o.value) : val === o.value} onClick={() => set(o.value)} />
            ))}
          </div>
        </section>
        {(q.multi || val) && (
          <div className="sticky bottom-0 mt-6 bg-background/90 py-4 backdrop-blur">
            <button className={btnPrimary} disabled={q.multi ? !(val as string[] | undefined)?.length : !val} onClick={next}>
              {s.step === QUESTIONS.length - 1 ? "See our games" : "Next"}
            </button>
          </div>
        )}
      </main>
    );
  }

  return <Results s={s} setS={setS} restart={restart} called={called} setCalled={setCalled} />;
}

function Results({ s, setS, restart, called, setCalled }: { s: State; setS: (s: State) => void; restart: () => void; called: boolean; setCalled: (b: boolean) => void }) {
  const all = useMemo(() => recommend(s.answers), [s.answers]);
  const trio = useMemo(() => pickTrio(all, s.offset), [all, s.offset]);
  const start = trio.map((t) => t.game.id).join();
  const [first, ...alts] = trio;
  const best = first!;
  return (
    <main className="mx-auto max-w-md px-5 py-6 pb-12">
      <p className="font-display text-lg font-bold text-primary">Peakon</p>
      <h1 className="mt-2 text-4xl font-bold">Your best match</h1>
      <div key={start} className="mt-5 space-y-5">
        <ResultCard result={best} best />
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <button className={btnPrimary} onClick={() => setCalled(true)}><PartyPopper className="h-5 w-5" />Call a Game Master</button>
          <p className="mt-3 text-center font-semibold text-muted-foreground">We’ll bring the game and teach you how to play.</p>
        </div>
        <h2 className="pt-2 text-2xl font-bold">Or try one of these</h2>
        {alts.map((a, i) => <ResultCard key={a.game.id} result={a} differs={howItDiffers(a.game, best.game)} delay={120 * (i + 1)} />)}
      </div>
      <div className="mt-8 grid gap-3">
        <button className={btnGhost} onClick={() => setS({ ...s, offset: s.offset + 1 })}><Sparkles className="h-5 w-5" />Try another recommendation</button>
        <button className={btnGhost} onClick={() => setS({ ...s, screen: "quiz", step: 0 })}>Change my answers</button>
        <button className={btnGhost} onClick={restart}><RotateCcw className="h-5 w-5" />Start over</button>
      </div>
      {called && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-5">
          <div className="animate-pop-in w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-card">
            <button aria-label="Close" onClick={() => setCalled(false)} className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-muted hover:bg-accent"><X className="h-5 w-5" /></button>
            <div className="text-6xl" aria-hidden>🎲</div>
            <h2 className="mt-3 text-3xl font-bold">Great choice!</h2>
            <p className="mt-2 text-lg">Show this screen to one of our Game Masters.</p>
            <p className="mt-4 rounded-2xl bg-accent p-4 font-display text-2xl font-bold">{best.game.gameTitle}</p>
          </div>
        </div>
      )}
    </main>
  );
}
