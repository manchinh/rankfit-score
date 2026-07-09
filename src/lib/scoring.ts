// RankFit Score Engine
// Time-weighted, decay-aware, tie-breaking-ready.

export interface HealthEntry {
  entry_date: string; // YYYY-MM-DD
  steps: number;
  distance_km: number;
  active_minutes: number;
  sleep_hours: number;
  bmi?: number | null;
}

export interface ScoreBreakdown {
  activity: number; // /250
  distance: number; // /150
  active_minutes: number; // /250
  consistency: number; // /200
  sleep: number; // /100
  bmi: number; // /50
  total: number; // /1000
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** 10k steps = 250, 2k = min. */
export const scoreActivity = (steps: number) =>
  Math.round(clamp(((steps - 2000) / (10000 - 2000)) * 250, 0, 250));

/** 5 km/day = 150, 1 km = 0. */
export const scoreDistance = (km: number) =>
  Math.round(clamp(((km - 1) / (5 - 1)) * 150, 0, 150));

/** 60 min = 250, 10 min = 0. */
export const scoreActive = (minutes: number) =>
  Math.round(clamp(((minutes - 10) / (60 - 10)) * 250, 0, 250));

/** 7–9 h = 100, drops as it deviates. */
export function scoreSleep(hours: number): number {
  if (hours >= 7 && hours <= 9) return 100;
  if (hours <= 0) return 0;
  const dist = hours < 7 ? 7 - hours : hours - 9;
  return Math.round(clamp(100 - dist * 25, 0, 100));
}

/** Consistency = active days in last 7. */
export function scoreConsistency(entries: HealthEntry[]): number {
  const activeDays = entries.filter(
    (e) => e.steps >= 3000 || e.active_minutes >= 15,
  ).length;
  const map: Record<number, number> = { 0: 0, 1: 20, 2: 40, 3: 80, 4: 120, 5: 160, 6: 180, 7: 200 };
  return map[Math.min(activeDays, 7)] ?? 0;
}

/** BMI: healthy range 18.5–24.9 = 50, drops as it deviates. */
export function scoreBmi(bmi?: number | null): number {
  if (!bmi || bmi <= 0) return 20; // neutral default when unknown
  if (bmi >= 18.5 && bmi <= 24.9) return 50;
  const dist = bmi < 18.5 ? 18.5 - bmi : bmi - 24.9;
  return Math.round(clamp(50 - dist * 6, 0, 50));
}

function daySnapshot(entry: HealthEntry, bmi?: number | null): ScoreBreakdown {
  const activity = scoreActivity(entry.steps);
  const distance = scoreDistance(entry.distance_km);
  const active_minutes = scoreActive(entry.active_minutes);
  const sleep = scoreSleep(entry.sleep_hours);
  const bmiScore = scoreBmi(bmi ?? entry.bmi);
  // Consistency is computed at the aggregate level; per-day snapshot uses full range.
  const consistency = 0;
  return {
    activity,
    distance,
    active_minutes,
    consistency,
    sleep,
    bmi: bmiScore,
    total: activity + distance + active_minutes + consistency + sleep + bmiScore,
  };
}

function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function windowSnapshots(entries: HealthEntry[], days: number, bmi?: number | null) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const key = cutoff.toISOString().slice(0, 10);
  return entries
    .filter((e) => e.entry_date >= key)
    .map((e) => daySnapshot(e, bmi));
}

/** Time-weighted RankFit Score. */
export function computeRankFitScore(
  entries: HealthEntry[],
  bmi?: number | null,
): { score: number; breakdown: ScoreBreakdown } {
  const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

  const last7 = windowSnapshots(sorted, 7, bmi);
  const last30 = windowSnapshots(sorted, 30, bmi);
  const long = sorted.map((e) => daySnapshot(e, bmi));

  const weighted = (snaps: ScoreBreakdown[]) => ({
    activity: average(snaps.map((s) => s.activity)),
    distance: average(snaps.map((s) => s.distance)),
    active_minutes: average(snaps.map((s) => s.active_minutes)),
    sleep: average(snaps.map((s) => s.sleep)),
    bmi: average(snaps.map((s) => s.bmi)),
  });

  const w7 = weighted(last7);
  const w30 = weighted(last30);
  const wLong = weighted(long);

  const blend = (k: keyof typeof w7) =>
    0.5 * (w7[k] || 0) + 0.3 * (w30[k] || 0) + 0.2 * (wLong[k] || 0);

  const activity = Math.round(blend("activity"));
  const distance = Math.round(blend("distance"));
  const active_minutes = Math.round(blend("active_minutes"));
  const sleep = Math.round(blend("sleep"));
  const bmiScore = Math.round(blend("bmi"));

  // Consistency uses last 7 days directly (not blended).
  const last7Entries = sorted.slice(-7);
  const consistency = scoreConsistency(last7Entries);

  const total = activity + distance + active_minutes + consistency + sleep + bmiScore;

  return {
    score: clamp(total, 0, 1000),
    breakdown: {
      activity,
      distance,
      active_minutes,
      consistency,
      sleep,
      bmi: bmiScore,
      total,
    },
  };
}

export function computeBmi(heightCm?: number | null, weightKg?: number | null): number | null {
  if (!heightCm || !weightKg || heightCm <= 0) return null;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function computeStreak(entries: HealthEntry[]): number {
  const active = new Set(
    entries
      .filter((e) => e.steps >= 3000 || e.active_minutes >= 15)
      .map((e) => e.entry_date),
  );
  let streak = 0;
  const d = new Date();
  // If today isn't active yet, start from yesterday so we don't punish current-day gap
  const todayKey = d.toISOString().slice(0, 10);
  if (!active.has(todayKey)) d.setDate(d.getDate() - 1);
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (active.has(key)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else break;
    if (streak > 3650) break;
  }
  return streak;
}

export function levelFromXp(xp: number): { level: number; title: string; progress: number } {
  const titles: Array<[number, string]> = [
    [1, "Beginner"],
    [5, "Mover"],
    [10, "Active"],
    [20, "Athlete"],
    [30, "Elite"],
    [50, "RankFit Legend"],
  ];
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 25)) + 1);
  const title = titles.reduce((acc, [lv, t]) => (level >= lv ? t : acc), "Beginner");
  const nextXp = (level) * (level) * 25;
  const prevXp = (level - 1) * (level - 1) * 25;
  const progress = clamp((xp - prevXp) / (nextXp - prevXp), 0, 1);
  return { level, title, progress };
}

export interface DailyChallengeSpec {
  key: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  progressFrom: (e: HealthEntry) => number;
}

export function todaysChallengeSpecs(): DailyChallengeSpec[] {
  return [
    {
      key: "steps_10k",
      title: "Hit 10,000 steps",
      description: "Walk your way to a full activity score.",
      target: 10000,
      reward: 5,
      progressFrom: (e) => e.steps,
    },
    {
      key: "active_30",
      title: "30 active minutes",
      description: "Get your heart rate up for at least half an hour.",
      target: 30,
      reward: 3,
      progressFrom: (e) => e.active_minutes,
    },
    {
      key: "sleep_7",
      title: "Sleep 7 hours",
      description: "Recovery is where progress happens.",
      target: 7,
      reward: 5,
      progressFrom: (e) => e.sleep_hours,
    },
  ];
}
