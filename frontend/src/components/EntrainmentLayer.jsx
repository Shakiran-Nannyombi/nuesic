import { useEffect, useRef } from "react";

export default function EntrainmentLayer({ carrierHz, frequencyHz, enabled, volume = 0.06 }) {
  const ctxRef = useRef(null);
  const leftOscRef = useRef(null);
  const rightOscRef = useRef(null);
  const gainRef = useRef(null);

  useEffect(() => {
    if (!enabled || ctxRef.current) return;

    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    const leftOsc = ctx.createOscillator();
    const leftPan = ctx.createStereoPanner();
    leftPan.pan.value = -1;
    leftOsc.type = "sine";
    leftOsc.frequency.value = carrierHz;
    leftOsc.connect(leftPan).connect(gain);
    leftOsc.start();

    const rightOsc = ctx.createOscillator();
    const rightPan = ctx.createStereoPanner();
    rightPan.pan.value = 1;
    rightOsc.type = "sine";
    rightOsc.frequency.value = carrierHz + frequencyHz;
    rightOsc.connect(rightPan).connect(gain);
    rightOsc.start();

    ctxRef.current = ctx;
    leftOscRef.current = leftOsc;
    rightOscRef.current = rightOsc;
    gainRef.current = gain;
  }, [enabled, carrierHz, frequencyHz]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;

    if (enabled) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.3);
    } else {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    }
  }, [enabled, volume]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const left = leftOscRef.current;
    const right = rightOscRef.current;
    if (!ctx || !left || !right) return;
    left.frequency.setValueAtTime(carrierHz, ctx.currentTime);
    right.frequency.setValueAtTime(carrierHz + frequencyHz, ctx.currentTime);
  }, [carrierHz, frequencyHz]);

  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        try { ctxRef.current.close(); } catch {}
      }
    };
  }, []);

  return (
    <div className="text-xs text-ink/60 text-center">
      {enabled
        ? `Entrainment active · ${frequencyHz} Hz (headphones required)`
        : "Entrainment paused"}
    </div>
  );
}
