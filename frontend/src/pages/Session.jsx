import { useCallback, useEffect, useRef, useState } from "react";
import EntrainmentLayer from "../components/EntrainmentLayer.jsx";
import FocusTimer from "../components/FocusTimer.jsx";
import FeedbackButtons from "../components/FeedbackButtons.jsx";
import { adaptSession, endSession } from "../api.js";

export default function Session({ profile: initialProfile, onEnd }) {
  const [profile, setProfile] = useState(initialProfile);
  const [blockIndex, setBlockIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(
    () => initialProfile.focus_blocks[0].duration_minutes * 60,
  );
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [running, setRunning] = useState(true);
  const [adapting, setAdapting] = useState(false);
  const [adaptMessage, setAdaptMessage] = useState(null);
  const [ending, setEnding] = useState(false);
  const startTimeRef = useRef(Date.now());

  const currentBlock = profile.focus_blocks[blockIndex];
  const isFocus = currentBlock?.type === "focus";
  const isLastBlock = blockIndex >= profile.focus_blocks.length - 1;
  const breaksCompleted = profile.focus_blocks
    .slice(0, blockIndex)
    .filter((b) => b.type === "break").length;

  const finishSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    setRunning(false);
    const durationStudied = Math.max(
      1,
      Math.floor((Date.now() - startTimeRef.current) / 60000),
    );
    const stats = {
      durationStudied,
      breaksTaken: breaksCompleted,
      feedbackHistory,
      totalBlocks: profile.focus_blocks.length,
      band: profile.entrainment_target,
      frequencyHz: profile.frequency_hz,
    };
    try {
      const summary = await endSession({
        durationStudied,
        breaksTaken: breaksCompleted,
        feedbackHistory,
      });
      onEnd({ ...summary, ...stats });
    } catch (e) {
      onEnd({
        focus_score: 0,
        insight: `Summary unavailable: ${e.message}`,
        recommendation: "Try another session when the connection is stable.",
        ...stats,
      });
    }
  }, [ending, breaksCompleted, feedbackHistory, onEnd, profile]);

  useEffect(() => {
    if (!currentBlock) return;
    setSecondsRemaining(currentBlock.duration_minutes * 60);
  }, [blockIndex]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running, blockIndex]);

  useEffect(() => {
    if (secondsRemaining !== 0 || !running) return;
    if (isLastBlock) {
      finishSession();
    } else {
      setBlockIndex((i) => i + 1);
    }
  }, [secondsRemaining, running, isLastBlock, finishSession]);

  async function handleFeedback(feedback) {
    if (adapting) return;
    setAdapting(true);
    setAdaptMessage(null);
    setFeedbackHistory((h) => [...h, feedback]);
    const minutesElapsed = Math.floor(
      (Date.now() - startTimeRef.current) / 60000,
    );
    try {
      const result = await adaptSession({
        currentFeedback: feedback,
        minutesElapsed,
        originalProfile: profile,
      });
      setAdaptMessage(result.message);

      if (result.action === "trigger_break") {
        const nextBreak = profile.focus_blocks.findIndex(
          (b, i) => i > blockIndex && b.type === "break",
        );
        if (nextBreak !== -1) {
          setBlockIndex(nextBreak);
        } else {
          finishSession();
        }
      } else if (
        result.action === "adjust_frequency" &&
        typeof result.new_frequency_hz === "number"
      ) {
        setProfile((p) => ({ ...p, frequency_hz: result.new_frequency_hz }));
      }
    } catch (e) {
      setAdaptMessage(`Adaptation failed: ${e.message}`);
    } finally {
      setAdapting(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-3">
          <p className="text-xs uppercase tracking-wide text-ink/60">
            {profile.entrainment_target} · {profile.frequency_hz} Hz · {profile.genre}
          </p>
          <div className="flex gap-1 justify-center">
            {profile.focus_blocks.map((b, i) => (
              <div
                key={i}
                title={`${b.duration_minutes}m ${b.type}`}
                className={`h-1.5 rounded-full transition-all ${
                  b.type === "focus" ? "w-10" : "w-4"
                } ${
                  i < blockIndex
                    ? "bg-ink/40"
                    : i === blockIndex
                      ? "bg-accent"
                      : "bg-ink/10"
                }`}
              />
            ))}
          </div>
        </header>

        <FocusTimer type={currentBlock.type} secondsRemaining={secondsRemaining} />

        {profile.track && (
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-lg"
              src={`${profile.track.embed_url}?autoplay=1`}
              title={profile.track.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        )}

        <EntrainmentLayer
          carrierHz={profile.carrier_hz}
          frequencyHz={profile.frequency_hz}
          enabled={running && isFocus}
        />

        {isFocus && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-ink/60">
              How are you doing?
            </p>
            <FeedbackButtons onFeedback={handleFeedback} disabled={adapting} />
            {adaptMessage && (
              <p className="text-sm text-ink/80 italic mt-2">{adaptMessage}</p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex-1 py-3 rounded-lg border border-ink/20"
          >
            {running ? "Pause" : "Resume"}
          </button>
          <button
            onClick={finishSession}
            disabled={ending}
            className="flex-1 py-3 rounded-lg border border-ink/20 text-ink/70 disabled:opacity-50"
          >
            End session
          </button>
        </div>
      </div>
    </div>
  );
}
