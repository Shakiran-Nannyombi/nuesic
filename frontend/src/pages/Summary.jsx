export default function Summary({ summary, onRestart }) {
  if (!summary) return null;

  return (
    <div className="min-h-full flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md space-y-6">
        <header>
          <p className="text-sm uppercase tracking-wide text-ink/60">Focus score</p>
          <h1 className="font-display text-7xl leading-none">{summary.focus_score}</h1>
        </header>

        <div className="space-y-3">
          <Block label="Insight" text={summary.insight} />
          <Block label="Recommendation" text={summary.recommendation} />
        </div>

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

function Block({ label, text }) {
  return (
    <div className="rounded-lg border border-ink/15 p-4">
      <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">{label}</p>
      <p className="text-sm">{text}</p>
    </div>
  );
}
