import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, TrendingUp, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "RankFit — Your Health. Your Score. Your Rank." },
      {
        name: "description",
        content:
          "Turn everyday movement into a live 0–1000 RankFit Score. Rank globally and by country. Build streaks, unlock achievements, and prove your consistency.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero-glow">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="text-display text-lg font-semibold">RankFit</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10 md:pt-20">
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              Health, gamified.
            </div>
            <h1 className="text-display mt-6 text-5xl font-semibold leading-[1.05] md:text-7xl">
              Your Health.
              <br />
              Your Score.
              <br />
              <span className="text-primary">Your Rank.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              RankFit turns your activity, sleep and consistency into a single
              live score from 0 to 1000 — then ranks you against the world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="text-base">
                  Get my RankFit Score
                </Button>
              </Link>
              <a href="#how" >
                <Button size="lg" variant="outline" className="text-base">
                  How it works
                </Button>
              </a>
            </div>
          </div>

          <ScorePreview />
        </section>

        <section id="how" className="mt-28 grid gap-6 md:grid-cols-4">
          <Feature
            icon={<Activity className="size-5" />}
            title="Log daily"
            body="Sync or enter steps, distance, active minutes, and sleep."
          />
          <Feature
            icon={<TrendingUp className="size-5" />}
            title="Time-weighted"
            body="50% last 7 days · 30% last 30 · 20% long-term. One bad day won't wreck you."
          />
          <Feature
            icon={<Trophy className="size-5" />}
            title="Real rankings"
            body="Global and country leaderboards, updated as your score moves."
          />
          <Feature
            icon={<Zap className="size-5" />}
            title="Streaks & badges"
            body="Daily challenges, XP, levels, and achievements keep you moving."
          />
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-card">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="text-display mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    </div>
  );
}

function ScorePreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/20 blur-3xl" />
      <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>RankFit Score</span>
          <span className="text-primary">+12 today</span>
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-display text-7xl font-semibold leading-none">842</span>
          <span className="pb-2 text-muted-foreground">/ 1000</span>
        </div>
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: "84%" }} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <MiniStat label="Global" value="#18,421" />
          <MiniStat label="Country" value="#152" />
          <MiniStat label="Streak" value="18 days 🔥" />
          <MiniStat label="Personal best" value="932 🏆" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-display mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}
