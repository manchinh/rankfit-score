import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { todaysChallengeSpecs } from "@/lib/scoring";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/challenges")({
  component: ChallengesPage,
});

function ChallengesPage() {
  const qc = useQueryClient();
  const specs = todaysChallengeSpecs();

  const { data, isLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");
      const today = new Date().toISOString().slice(0, 10);

      const { data: existing } = await supabase
        .from("challenges").select("*")
        .eq("user_id", user.id).eq("challenge_date", today);

      // Seed today's challenges if missing
      const owned = new Set((existing ?? []).map((c) => c.challenge_key));
      const missing = specs.filter((s) => !owned.has(s.key));
      if (missing.length) {
        await supabase.from("challenges").insert(missing.map((s) => ({
          user_id: user.id,
          challenge_date: today,
          challenge_key: s.key,
          title: s.title,
          description: s.description,
          target: s.target,
          reward_points: s.reward,
          progress: 0,
          completed: false,
        })));
      }

      const { data: entry } = await supabase
        .from("health_entries").select("*")
        .eq("user_id", user.id).eq("entry_date", today).maybeSingle();

      const { data: refreshed } = await supabase
        .from("challenges").select("*")
        .eq("user_id", user.id).eq("challenge_date", today);

      // Compute live progress from today's health entry
      const withLive = (refreshed ?? []).map((c) => {
        const spec = specs.find((s) => s.key === c.challenge_key);
        if (!spec) return c;
        const live = entry ? spec.progressFrom({
          entry_date: today,
          steps: Number(entry.steps ?? 0),
          distance_km: Number(entry.distance_km ?? 0),
          active_minutes: Number(entry.active_minutes ?? 0),
          sleep_hours: Number(entry.sleep_hours ?? 0),
        }) : 0;
        return { ...c, progress: live };
      });

      return withLive;
    },
  });

  const claim = async (id: string, reward: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("challenges").update({ completed: true }).eq("id", id);
    await supabase.rpc as unknown; // no rpc — update xp on profile directly
    const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).maybeSingle();
    await supabase.from("profiles").update({ xp: (profile?.xp ?? 0) + reward }).eq("id", user.id);
    toast.success(`+${reward} XP claimed`);
    qc.invalidateQueries({ queryKey: ["challenges"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <AppShell title="Challenges">
      <h1 className="text-display text-2xl font-semibold">Today's challenges</h1>
      <p className="mt-1 text-sm text-muted-foreground">Complete these to earn XP and level up.</p>

      <div className="mt-6 space-y-3">
        {(isLoading || !data ? Array.from({ length: 3 }).map(() => null) : data).map((c, i) => {
          if (!c) return <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />;
          const target = Number(c.target);
          const progress = Number(c.progress);
          const pct = Math.min(100, (progress / target) * 100);
          const canClaim = progress >= target && !c.completed;
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-display text-lg font-semibold">{c.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{c.description}</div>
                </div>
                <div className="whitespace-nowrap rounded-full border border-primary/40 px-2 py-1 text-xs text-primary">
                  +{c.reward_points} XP
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Progress value={pct} className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {progress.toLocaleString()} / {target.toLocaleString()}
                </span>
              </div>
              {c.completed ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="size-4" /> Claimed
                </div>
              ) : canClaim ? (
                <button
                  onClick={() => claim(c.id, c.reward_points)}
                  className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Claim reward
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
