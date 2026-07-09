interface ScoreRingProps {
  score: number;
  max?: number;
  size?: number;
  label?: string;
}

export function ScoreRing({ score, max = 1000, size = 220, label = "RankFit Score" }: ScoreRingProps) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / max));
  const dash = c * pct;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: "stroke-dasharray 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-display mt-1 text-6xl font-semibold leading-none">{score}</div>
        <div className="mt-1 text-xs text-muted-foreground">/ {max}</div>
      </div>
    </div>
  );
}
