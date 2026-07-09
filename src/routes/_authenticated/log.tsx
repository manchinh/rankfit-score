import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { recomputeAndPersist } from "@/lib/rankfit-data";
import { computeBmi } from "@/lib/scoring";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/log")({
  component: LogPage,
});

function LogPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [steps, setSteps] = useState("");
  const [distance, setDistance] = useState("");
  const [active, setActive] = useState("");
  const [sleep, setSleep] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("health_entries").select("*")
        .eq("user_id", user.id).eq("entry_date", date).maybeSingle();
      if (data) {
        setSteps(String(data.steps ?? ""));
        setDistance(String(data.distance_km ?? ""));
        setActive(String(data.active_minutes ?? ""));
        setSleep(String(data.sleep_hours ?? ""));
        setWeight(data.weight_kg ? String(data.weight_kg) : "");
      } else {
        setSteps(""); setDistance(""); setActive(""); setSleep(""); setWeight("");
      }
    })();
  }, [date]);

  const save = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("height_cm").eq("id", user.id).maybeSingle();
    const w = weight ? parseFloat(weight) : null;
    const bmi = w && profile?.height_cm ? computeBmi(profile.height_cm, w) : null;

    const { error } = await supabase.from("health_entries").upsert({
      user_id: user.id,
      entry_date: date,
      steps: steps ? parseInt(steps) : 0,
      distance_km: distance ? parseFloat(distance) : 0,
      active_minutes: active ? parseInt(active) : 0,
      sleep_hours: sleep ? parseFloat(sleep) : 0,
      weight_kg: w,
      bmi,
    }, { onConflict: "user_id,entry_date" });

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    if (w) {
      await supabase.from("profiles").update({ weight_kg: w }).eq("id", user.id);
    }

    const result = await recomputeAndPersist(user.id);
    setLoading(false);
    qc.invalidateQueries();
    toast.success(`Score updated: ${result.score} (${result.delta >= 0 ? "+" : ""}${result.delta})`);
    navigate({ to: "/dashboard" });
  };

  return (
    <AppShell title="Log activity">
      <h1 className="text-display text-2xl font-semibold">Log your day</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter today's stats — or backfill a previous day. Your score recomputes instantly.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Steps</Label>
            <Input type="number" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="8500" />
          </div>
          <div>
            <Label>Distance (km)</Label>
            <Input type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="5.8" />
          </div>
          <div>
            <Label>Active minutes</Label>
            <Input type="number" value={active} onChange={(e) => setActive(e.target.value)} placeholder="42" />
          </div>
          <div>
            <Label>Sleep (hours)</Label>
            <Input type="number" step="0.1" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="7.5" />
          </div>
          <div className="col-span-2">
            <Label>Weight today (kg, optional)</Label>
            <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="72.3" />
          </div>
        </div>

        <Button className="w-full" onClick={save} disabled={loading}>
          {loading ? "Saving…" : "Save & update score"}
        </Button>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
        Tip: Web-only for now — Apple Health / Google Health Connect sync are coming.
        Log honestly and consistency will do the rest.
      </div>
    </AppShell>
  );
}
