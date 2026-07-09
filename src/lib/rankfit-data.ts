// Shared data hooks + score recompute helper for authenticated screens.
import { supabase } from "@/integrations/supabase/client";
import {
  computeRankFitScore,
  computeStreak,
  computeBmi,
  levelFromXp,
  type HealthEntry,
  type ScoreBreakdown,
} from "@/lib/scoring";

export interface ProfileRow {
  id: string;
  name: string;
  email: string | null;
  country: string;
  height_cm: number | null;
  weight_kg: number | null;
  avatar_url: string | null;
  current_score: number;
  personal_best_score: number;
  highest_global_rank: number | null;
  highest_country_rank: number | null;
  current_streak: number;
  longest_streak: number;
  days_above_900: number;
  xp: number;
  level: number;
  last_active_date: string | null;
  is_active: boolean;
  onboarded: boolean;
}

export async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as ProfileRow) ?? null;
}

export async function loadHealthEntries(userId: string, days = 90): Promise<HealthEntry[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data } = await supabase
    .from("health_entries")
    .select("entry_date, steps, distance_km, active_minutes, sleep_hours, bmi")
    .eq("user_id", userId)
    .gte("entry_date", cutoff.toISOString().slice(0, 10))
    .order("entry_date", { ascending: true });
  return (data ?? []).map((r) => ({
    entry_date: r.entry_date as string,
    steps: Number(r.steps ?? 0),
    distance_km: Number(r.distance_km ?? 0),
    active_minutes: Number(r.active_minutes ?? 0),
    sleep_hours: Number(r.sleep_hours ?? 0),
    bmi: r.bmi != null ? Number(r.bmi) : null,
  }));
}

/** Recalculate & persist score + streaks + xp/level. Returns the updated snapshot. */
export async function recomputeAndPersist(userId: string): Promise<{
  score: number;
  breakdown: ScoreBreakdown;
  streak: number;
  personalBest: number;
  delta: number;
  reasons: string[];
}> {
  const [profile, entries] = await Promise.all([loadProfile(userId), loadHealthEntries(userId)]);
  const bmi = profile ? computeBmi(profile.height_cm, profile.weight_kg) : null;
  const { score, breakdown } = computeRankFitScore(entries, bmi);
  const streak = computeStreak(entries);
  const previous = profile?.current_score ?? 0;
  const delta = score - previous;
  const personalBest = Math.max(profile?.personal_best_score ?? 0, score);
  const longestStreak = Math.max(profile?.longest_streak ?? 0, streak);
  const daysAbove900 = (profile?.days_above_900 ?? 0) + (previous < 900 && score >= 900 ? 1 : 0);

  const reasons: string[] = [];
  if (breakdown.activity >= 220) reasons.push("+ Strong daily activity");
  if (breakdown.consistency >= 160) reasons.push("+ Great consistency this week");
  if (breakdown.sleep >= 80) reasons.push("+ Solid sleep recovery");
  if (breakdown.activity < 100) reasons.push("− Low step activity");
  if (breakdown.consistency < 80) reasons.push("− Inconsistent active days");
  if (breakdown.sleep < 40) reasons.push("− Not enough sleep");

  const xp = (profile?.xp ?? 0) + Math.max(0, delta);
  const { level } = levelFromXp(xp);

  const today = new Date().toISOString().slice(0, 10);

  await supabase.from("profiles").update({
    current_score: score,
    personal_best_score: personalBest,
    current_streak: streak,
    longest_streak: longestStreak,
    days_above_900: daysAbove900,
    xp,
    level,
    last_active_date: today,
    is_active: true,
  }).eq("id", userId);

  await supabase.from("score_history").upsert({
    user_id: userId,
    score_date: today,
    current_score: score,
    personal_best: personalBest,
    activity_score: breakdown.activity,
    distance_score: breakdown.distance,
    active_minutes_score: breakdown.active_minutes,
    consistency_score: breakdown.consistency,
    sleep_score: breakdown.sleep,
    bmi_score: breakdown.bmi,
    change_delta: delta,
    change_reasons: reasons,
  }, { onConflict: "user_id,score_date" });

  // Achievement checks
  await checkAndUnlock(userId, entries, score, streak);

  return { score, breakdown, streak, personalBest, delta, reasons };
}

const ACHIEVEMENTS = [
  { key: "first_10k", name: "First 10K Steps", description: "Walked 10,000 steps in a single day.", icon: "👟",
    check: (e: HealthEntry[]) => e.some((d) => d.steps >= 10000) },
  { key: "streak_7", name: "7 Day Streak", description: "Stay active 7 days in a row.", icon: "🔥",
    check: (_e: HealthEntry[], _s: number, streak: number) => streak >= 7 },
  { key: "streak_30", name: "30 Day Streak", description: "One month of consistency.", icon: "🏅",
    check: (_e: HealthEntry[], _s: number, streak: number) => streak >= 30 },
  { key: "km_100", name: "100 KM Walked", description: "Cumulative distance milestone.", icon: "🌍",
    check: (e: HealthEntry[]) => e.reduce((a, b) => a + b.distance_km, 0) >= 100 },
  { key: "score_900", name: "Score Above 900", description: "Reached elite territory.", icon: "🏆",
    check: (_e: HealthEntry[], s: number) => s >= 900 },
  { key: "score_500", name: "Score Above 500", description: "Halfway to the top.", icon: "⭐",
    check: (_e: HealthEntry[], s: number) => s >= 500 },
];

async function checkAndUnlock(userId: string, entries: HealthEntry[], score: number, streak: number) {
  const { data: existing } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("user_id", userId);
  const owned = new Set((existing ?? []).map((r) => r.achievement_key));
  const toAdd = ACHIEVEMENTS.filter(
    (a) => !owned.has(a.key) && a.check(entries, score, streak),
  );
  if (!toAdd.length) return;
  await supabase.from("achievements").insert(
    toAdd.map((a) => ({
      user_id: userId,
      achievement_key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
    })),
  );
}

export const ALL_ACHIEVEMENTS = ACHIEVEMENTS;
