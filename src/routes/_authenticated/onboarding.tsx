import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { computeBmi } from "@/lib/scoring";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("United States");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("name, country, onboarded")
        .eq("id", data.user.id)
        .maybeSingle();
      if (p) {
        setName(p.name || data.user.user_metadata?.name || "");
        setCountry(p.country && p.country !== "Unknown" ? p.country : "United States");
        if (p.onboarded) navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  const save = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const h = height ? parseFloat(height) : null;
    const w = weight ? parseFloat(weight) : null;
    const { error } = await supabase.from("profiles").update({
      name,
      country,
      date_of_birth: dob || null,
      gender: gender || null,
      height_cm: h,
      weight_kg: w,
      onboarded: true,
    }).eq("id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);

    // Seed a starting health entry if weight/height provided so BMI has a value
    if (h && w) {
      const bmi = computeBmi(h, w);
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from("health_entries").upsert({
        user_id: user.id,
        entry_date: today,
        steps: 0,
        distance_km: 0,
        active_minutes: 0,
        sleep_hours: 0,
        weight_kg: w,
        bmi,
      }, { onConflict: "user_id,entry_date" });
    }

    toast.success("You're all set!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-hero-glow px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Step {step} of 2</div>
        <h1 className="text-display mt-2 text-3xl font-semibold">
          {step === 1 ? "Welcome to RankFit" : "One last thing"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 1
            ? "Tell us a bit about you so we can rank you fairly."
            : "Height & weight power your BMI trend (5% of your score). You can update anytime."}
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          {step === 1 ? (
            <>
              <div>
                <Label>Display name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex R." />
              </div>
              <div>
                <Label>Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date of birth</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div>
                  <Label>Gender (optional)</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="nonbinary">Non-binary</SelectItem>
                      <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!name || !country}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Height (cm)</Label>
                  <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="72" />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3 text-xs text-muted-foreground">
                Your health data is private. Only your username, country, RankFit Score,
                and badges are shown on rankings.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="w-1/3" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={save} disabled={loading}>
                  {loading ? "Saving…" : "Enter RankFit"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
