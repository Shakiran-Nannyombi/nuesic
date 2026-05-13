const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "2 hrs", value: 120 },
];

export default function DurationSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm uppercase tracking-wide text-ink/70 mb-2">
        Study duration
      </label>
      <div className="grid grid-cols-4 gap-2">
        {DURATIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(d.value)}
            className={`py-3 rounded-lg border text-sm transition ${
              value === d.value
                ? "bg-ink text-cream border-ink"
                : "bg-cream border-ink/15 hover:border-ink/40"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
