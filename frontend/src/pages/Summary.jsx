export default function Summary({ summary, onRestart }) {
  if (!summary) return null;

  const counts = (summary.feedbackHistory || []).reduce(
    (acc, f) => ({ ...acc, [f]: (acc[f] || 0) + 1 }),
    {},
  );

  return (
    <div className="min-h-full flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <p className="text-xs uppercase tracking-wide text-ink/60 mb-2">
            Session complete
          </p>
          <ScoreRing score={summary.focus_score} />
        </header>

        <StatsRow
          duration={summary.durationStudied}
          breaks={summary.breaksTaken}
          checkins={(summary.feedbackHistory || []).length}
        />

        <div className="space-y-3">
          <Card label="Insight" text={summary.insight} />
          <Card label="For next time" text={summary.recommendation} />
        </div>

        {Object.keys(counts).length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/60 mb-2">
              Check-ins
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(counts).map(([k, v]) => (
                <span
                  key={k}
                  className="px-3 py-1 rounded-full border border-ink/15 text-xs"
                >
                  {labelFor(k)} · {v}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-lg bg-accent text-cream font-medium tracking-wide"
        >
          Start a new session
        </button>
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const value = Math.max(0, Math.min(100, score ?? 0));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;

  return (
    <div className="relative inline-block">
      <svg viewBox="0 0 120 120" className="w-44 h-44 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(14,14,16,0.08)" strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#c46a3d"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl leading-none">{value}</span>
        <span className="text-xs uppercase tracking-wide text-ink/60 mt-1">
          focus score
        </span>
      </div>
    </div>
  );
}

function StatsRow({ duration, breaks, checkins }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <Stat value={`${duration ?? 0}m`} label="studied" />
      <Stat value={breaks ?? 0} label="breaks" />
      <Stat value={checkins ?? 0} label="check-ins" />
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-lg border border-ink/15 py-3">
      <p className="font-display text-2xl leading-none">{value}</p>
      <p className="text-xs uppercase tracking-wide text-ink/60 mt-1">{label}</p>
    </div>
  );
}

function Card({ label, text }) {
  return (
    <div className="rounded-lg border border-ink/15 p-4">
      <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">{label}</p>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

const LABELS = {
  focused: "Focused",
  losing_focus: "Drifting",
  anxious: "Anxious",
};

function labelFor(key) {
  return LABELS[key] ?? key;
}
