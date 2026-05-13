const SUBJECTS = [
  "Mathematics",
  "Sciences",
  "Essays",
  "Memorization",
  "Languages",
  "Coding",
];

export default function SubjectSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm uppercase tracking-wide text-ink/70 mb-2">
        Subject
      </label>
      <div className="grid grid-cols-2 gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`px-4 py-3 rounded-lg border text-left transition ${
              value === s
                ? "bg-ink text-cream border-ink"
                : "bg-cream border-ink/15 hover:border-ink/40"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
