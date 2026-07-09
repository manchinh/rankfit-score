import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ScoreRing } from "@/components/ScoreRing";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile, loadHealthEntries } from "@/lib/rankfit-data";
import { Footprints, MapPin, Timer, Moon, Flame, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");
      const [profile, entries, todaysChange] = await Promise.all([
        loadProfile(user.id),
        loadHealthEntries(user.id, 30),
        supabase.from("score_history").select("*").eq("user_id", user.id)
          .order("score_date", { ascending: false }).limit(1).maybeSingle(),
      ]);
      // Global + country rank
      const { count: globalAhead } = await supabase
        .from("profiles").select("*", { count: "exact", head: true })
        .gt("current_score", profile?.current_score ?? 0)
        .eq("is_active", true);
      const { count: countryAhead } = await supabase
        .from("profiles").select("*", { count: "exact", head: true })
        .gt("current_score", profile?.current_score ?? 0)
        .eq("country", profile?.country ?? "").eq("is_active", true);

      const today = new Date().toISOString().slice(0, 10);
      const todaysEntry = entries.find((e) => e.entry_date === today);

      return {
        profile,
        entries,
        todaysEntry,
        globalRank: (globalAhead ?? 0) + 1,
        countryRank: (countryAhead ?? 0) + 1,
        todaysChange: todaysChange.data,
      };
    },
  });

  useEffect(() => {
    if (data?.profile && !data.profile.onboarded) navigate({ to: "/onboarding" });
  }, [data, navigate]);

  if (isLoading || !data) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-56 w-56 rounded-full bg-card" />
          <div className="h-24 rounded-2xl bg-card" />
          <div className="h-40 rounded-2xl bg-card" />
        </div>
      </AppShell>
    );
  }

  const p = data.profile!;
  const t = data.todaysEntry;
  const delta = data.todaysChange?.change_delta ?? 0;

  return (
    <AppShell>
      <div className="text-center">
        <div className="text-sm text-muted-foreground">Hello, {p.name || "athlete"}.</div>
      </div>

      <div className="mt-6">
        <ScoreRing score={p.current_score} />
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <div className={`rounded-full border px-3 py-1 text-sm ${delta >= 0 ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}`}>
          {delta >= 0 ? "+" : ""}{delta} today
        </div>
        <div className="rounded-full border border-streak/40 px-3 py-1 text-sm text-streak">
          <Flame className="mr-1 inline size-3.5" />
          {p.current_streak} day streak
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <RankCard label="Global rank" value={`#${data.globalRank.toLocaleString()}`} />
        <RankCard label={`${p.country} rank`} value={`#${data.countryRank.toLocaleString()}`} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-display text-lg font-semibold">Today's activity</h2>
        <Link to="/log">
          <Button size="sm" variant="outline">
            <Plus className="mr-1 size-4" />
            Log
          </Button>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatTile icon={Footprints} label="Steps" value={(t?.steps ?? 0).toLocaleString()} />
        <StatTile icon={MapPin} label="Distance" value={`${(t?.distance_km ?? 0).toFixed(1)} km`} />
        <StatTile icon={Timer} label="Active min" value={`${t?.active_minutes ?? 0}`} />
        <StatTile icon={Moon} label="Sleep" value={t?.sleep_hours ? `${Math.floor(t.sleep_hours)}h ${Math.round((t.sleep_hours % 1) * 60)}m` : "—"} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Personal best</div>
            <div className="text-display mt-1 text-3xl font-semibold">
              {p.personal_best_score} <span className="text-lg">🏆</span>
            </div>
          </div>
          <Link to="/score" className="text-sm text-primary">Score breakdown →</Link>
        </div>
      </div>
    </AppShell>
  );
}

function RankCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-display mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-display mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
