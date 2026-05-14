export default function FocusTimer({ type, secondsRemaining }) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wide text-ink/60 mb-1">
        {type === "focus" ? "Focus block" : "Break"}
      </p>
      <p className="font-display text-6xl sm:text-7xl tabular-nums leading-none">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
