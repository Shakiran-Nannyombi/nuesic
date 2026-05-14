const API_BASE = import.meta.env.VITE_API_URL || "";

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export function generateSession({ stressLevel, subject, durationMinutes, mood }) {
  return postJSON("/api/generate-session", {
    stress_level: stressLevel,
    subject,
    duration_minutes: durationMinutes,
    mood: mood || null,
  });
}

export function adaptSession({ currentFeedback, minutesElapsed, originalProfile }) {
  return postJSON("/api/adapt-session", {
    current_feedback: currentFeedback,
    minutes_elapsed: minutesElapsed,
    original_profile: originalProfile,
  });
}

export function endSession({ durationStudied, breaksTaken, feedbackHistory }) {
  return postJSON("/api/end-session", {
    duration_studied: durationStudied,
    breaks_taken: breaksTaken,
    feedback_history: feedbackHistory,
  });
}
