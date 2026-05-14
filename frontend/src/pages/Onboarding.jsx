import { useState } from "react";
import StressSlider from "../components/StressSlider.jsx";
import SubjectSelector from "../components/SubjectSelector.jsx";
import DurationSelector from "../components/DurationSelector.jsx";
import { generateSession } from "../api.js";

export default function Onboarding({ onSessionGenerated }) {
  const [stressLevel, setStressLevel] = useState(5);
  const [subject, setSubject] = useState("Mathematics");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const profile = await generateSession({
        stressLevel,
        subject,
        durationMinutes,
      });
      onSessionGenerated(profile);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo-nuesic.png" alt="Neusic logo" className="h-14 w-14 sm:h-20 sm:w-20 object-contain" />
            <h1 className="font-display text-4xl sm:text-5xl leading-none">Neusic</h1>
          </div>
          <p className="text-ink/60 text-sm">
            Tell me where you are. I'll engineer the right mental state.
          </p>
        </header>

        <div className="space-y-5">
          <StressSlider value={stressLevel} onChange={setStressLevel} />
          <SubjectSelector value={subject} onChange={setSubject} />
          <DurationSelector value={durationMinutes} onChange={setDurationMinutes} />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-6 w-full py-4 rounded-lg bg-accent text-cream font-medium tracking-wide disabled:opacity-50 text-sm sm:text-base"
        >
          {loading ? "Building your focus profile..." : "Generate my session"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
