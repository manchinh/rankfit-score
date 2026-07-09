import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/rankfit-data";
import { levelFromXp } from "@/lib/scoring";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");
      const [profile, ach] = await Promise.all([
        loadProfile(user.id),
        supabase.from("achievements").select("*", { count: "exact" }).eq("user_id", user.id),
      ]);
      return { profile, achievementCount: ach.count ?? 0 };
    },
  });

  if (isLoading || !data?.profile) return <AppShell title="Profile"><div className="h-96 animate-pulse rounded-2xl bg-card" /></AppShell>;
  const p = data.profile;
  const lvl = levelFromXp(p.xp);

  return (
    <AppShell title="Profile">
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/15 text-3xl">
          {(p.name || "R").slice(0, 1).toUpperCase()}
        </div>
        <div className="text-display mt-3 text-2xl font-semibold">{p.name}</div>
        <div className="text-sm text-muted-foreground">{p.country}</div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <Stat label="Current Score" value={p.current_score} />
          <Stat label="Personal Best" value={`${p.personal_best_score} 🏆`} />
          <Stat label="Current Streak" value={`${p.current_streak}d`} />
          <Stat label="Longest Streak" value={`${p.longest_streak}d`} />
          <Stat label="Days Above 900" value={p.days_above_900} />
          <Stat label="Achievements" value={data.achievementCount} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Level {lvl.level}</div>
            <div className="text-display text-xl font-semibold">{lvl.title}</div>
          </div>
          <div className="text-sm text-muted-foreground">{p.xp} XP</div>
        </div>
        <Progress value={lvl.progress * 100} className="mt-3" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/achievements" className="rounded-2xl border border-border bg-card p-4 text-center shadow-card hover:bg-accent">
          <div className="text-display text-lg font-semibold">Achievements</div>
          <div className="text-xs text-muted-foreground">View all badges</div>
        </Link>
        <Link to="/log" className="rounded-2xl border border-border bg-card p-4 text-center shadow-card hover:bg-accent">
          <div className="text-display text-lg font-semibold">Log activity</div>
          <div className="text-xs text-muted-foreground">Update today's data</div>
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-display mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
