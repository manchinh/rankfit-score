import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ScoreRing } from "@/components/ScoreRing";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/rankfit-data";

export const Route = createFileRoute("/_authenticated/score")({
  component: ScorePage,
});

const CATS = [
  { key: "activity_score", label: "Activity", max: 250 },
  { key: "distance_score", label: "Distance", max: 150 },
  { key: "active_minutes_score", label: "Active Minutes", max: 250 },
  { key: "consistency_score", label: "Consistency", max: 200 },
  { key: "sleep_score", label: "Sleep", max: 100 },
  { key: "bmi_score", label: "BMI", max: 50 },
] as const;

function ScorePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["score-page"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");
      const profile = await loadProfile(user.id);
      const { data: history } = await supabase
        .from("score_history")
        .select("*")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
        .limit(1);
      return { profile, latest: history?.[0] ?? null };
    },
  });

  if (isLoading || !data?.profile) {
    return <AppShell title="Score"><div className="h-96 animate-pulse rounded-2xl bg-card" /></AppShell>;
  }

  const p = data.profile;
  const latest = data.latest;
  const delta = latest?.change_delta ?? 0;
  const reasons: string[] = (latest?.change_reasons as string[]) ?? [];

  return (
    <AppShell title="Score">
      <ScoreRing score={p.current_score} />

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Today's change</div>
        <div className={`text-display mt-1 text-4xl font-semibold ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
          {delta >= 0 ? "+" : ""}{delta}
        </div>
        {reasons.length ? (
          <ul className="mt-4 space-y-2 text-sm">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className={r.startsWith("+") ? "text-primary" : "text-destructive"}>
                  {r.startsWith("+") ? "▲" : "▼"}
                </span>
                <span className="text-muted-foreground">{r.slice(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Log some activity to see why your score moved.</p>
        )}
      </div>

      <h3 className="text-display mt-8 text-lg font-semibold">Breakdown</h3>
      <div className="mt-3 space-y-3">
        {CATS.map((c) => {
          const val = (latest?.[c.key as keyof typeof latest] as number) ?? 0;
          const pct = Math.min(100, (val / c.max) * 100);
          return (
            <div key={c.key} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{c.label}</span>
                <span className="text-display text-sm text-muted-foreground">
                  <span className="text-foreground text-base font-semibold">{val}</span> / {c.max}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
        Your Current RankFit Score is time-weighted:
        <span className="text-foreground"> 50%</span> last 7 days,
        <span className="text-foreground"> 30%</span> last 30,
        <span className="text-foreground"> 20%</span> long-term.
        Consistency uses your last 7 days directly.
      </div>
    </AppShell>
  );
}
