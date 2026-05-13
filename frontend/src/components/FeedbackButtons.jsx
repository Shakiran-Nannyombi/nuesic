const OPTIONS = [
  { value: "focused", label: "Still focused" },
  { value: "losing_focus", label: "Losing focus" },
  { value: "anxious", label: "Anxious" },
];

export default function FeedbackButtons({ onFeedback, disabled }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onFeedback(o.value)}
          className="py-3 px-2 rounded-lg border border-ink/20 text-sm hover:bg-ink/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
