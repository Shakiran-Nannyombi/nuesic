export default function StressSlider({ value, onChange }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm uppercase tracking-wide text-ink/70">
          Stress level
        </label>
        <span className="font-display text-3xl">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <div className="flex justify-between text-xs text-ink/50 mt-1">
        <span>calm</span>
        <span>overwhelmed</span>
      </div>
    </div>
  );
}
