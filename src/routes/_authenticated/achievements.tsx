import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { ALL_ACHIEVEMENTS } from "@/lib/rankfit-data";

export const Route = createFileRoute("/_authenticated/achievements")({
  component: AchievementsPage,
});

function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");
      const { data: unlocked } = await supabase
        .from("achievements").select("achievement_key").eq("user_id", user.id);
      return new Set((unlocked ?? []).map((r) => r.achievement_key));
    },
  });

  return (
    <AppShell title="Achievements">
      <h1 className="text-display text-2xl font-semibold">Achievements</h1>
      <p className="mt-1 text-sm text-muted-foreground">Badges you've earned on your RankFit journey.</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {ALL_ACHIEVEMENTS.map((a) => {
          const owned = data?.has(a.key) ?? false;
          return (
            <div
              key={a.key}
              className={`rounded-2xl border p-4 text-center shadow-card ${
                owned ? "border-primary/50 bg-card" : "border-border bg-card/40 opacity-60"
              }`}
            >
              <div className="text-4xl">{owned ? a.icon : "🔒"}</div>
              <div className="text-display mt-2 font-semibold">{a.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{a.description}</div>
            </div>
          );
        })}
        {isLoading && <div className="col-span-2 h-24 animate-pulse rounded-2xl bg-card" />}
      </div>
    </AppShell>
  );
}
