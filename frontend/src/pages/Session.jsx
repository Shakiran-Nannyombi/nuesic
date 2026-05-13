export default function Session({ profile, onEnd }) {
  if (!profile) return null;

  return (
    <div className="min-h-full flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md space-y-6">
        <header>
          <h1 className="font-display text-3xl mb-1">Your session</h1>
          <p className="text-ink/60 text-sm">{profile.opening_message}</p>
        </header>

        <div className="rounded-lg border border-ink/15 p-4 space-y-2">
          <Row label="Band" value={`${profile.entrainment_target} (${profile.frequency_hz} Hz)`} />
          <Row label="Genre" value={profile.genre} />
          <Row label="Tempo" value={`${profile.tempo_bpm_min}-${profile.tempo_bpm_max} BPM`} />
          <Row label="Blocks" value={profile.focus_blocks.map((b) => `${b.duration_minutes}m ${b.type}`).join(" / ")} />
        </div>

        {profile.track && (
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-lg"
              src={profile.track.embed_url}
              title={profile.track.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        )}

        <p className="text-xs text-ink/50">
          Session player, focus timer, and entrainment layer come next.
        </p>

        <button
          onClick={() => onEnd({ focus_score: 0, insight: "(stub)", recommendation: "(stub)" })}
          className="w-full py-3 rounded-lg border border-ink/20 text-ink/70"
        >
          End session (stub)
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink/50 uppercase tracking-wide text-xs">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
