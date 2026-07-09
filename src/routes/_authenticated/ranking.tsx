import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadProfile } from "@/lib/rankfit-data";
import { Flame, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ranking")({
  component: RankingPage,
});

interface RankRow {
  id: string;
  name: string;
  country: string;
  current_score: number;
  longest_streak: number;
}

function RankingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ranking"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");
      const me = await loadProfile(user.id);
      const { data: global } = await supabase
        .from("profiles")
        .select("id, name, country, current_score, longest_streak, personal_best_score")
        .eq("is_active", true)
        .order("current_score", { ascending: false })
        .order("longest_streak", { ascending: false })
        .order("personal_best_score", { ascending: false })
        .limit(100);
      const { data: country } = me
        ? await supabase
            .from("profiles")
            .select("id, name, country, current_score, longest_streak, personal_best_score")
            .eq("country", me.country).eq("is_active", true)
            .order("current_score", { ascending: false })
            .order("longest_streak", { ascending: false })
            .order("personal_best_score", { ascending: false })
            .limit(100)
        : { data: [] };
      return { me, global: (global ?? []) as RankRow[], country: (country ?? []) as RankRow[] };
    },
  });

  if (isLoading || !data) return <AppShell title="Ranking"><div className="h-96 animate-pulse rounded-2xl bg-card" /></AppShell>;

  return (
    <AppShell title="Ranking">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Your position</div>
            <div className="text-display text-xl font-semibold">
              Global #{(data.global.findIndex((r) => r.id === data.me?.id) + 1) || "—"}
              <span className="mx-2 text-muted-foreground">·</span>
              {data.me?.country} #{(data.country.findIndex((r) => r.id === data.me?.id) + 1) || "—"}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="global" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="country">{data.me?.country ?? "Country"}</TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="mt-4">
          <List rows={data.global} meId={data.me?.id} />
        </TabsContent>
        <TabsContent value="country" className="mt-4">
          <List rows={data.country} meId={data.me?.id} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function List({ rows, meId }: { rows: RankRow[]; meId?: string }) {
  if (!rows.length) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No ranked users yet. Log 7 days of activity to appear on leaderboards.</div>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => {
        const rank = i + 1;
        const isMe = r.id === meId;
        return (
          <li
            key={r.id}
            className={`flex items-center justify-between rounded-2xl border p-3 ${
              isMe ? "border-primary/60 bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${
                rank <= 3 ? "bg-gold text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}>
                {rank}
              </div>
              <div>
                <div className="font-medium">{r.name || "—"} {isMe && <span className="ml-1 text-xs text-primary">(you)</span>}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{r.country}</span>
                  {r.longest_streak > 0 && (
                    <span className="text-streak"><Flame className="mr-1 inline size-3" />{r.longest_streak}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-display text-lg font-semibold">{r.current_score}</div>
          </li>
        );
      })}
    </ul>
  );
}
