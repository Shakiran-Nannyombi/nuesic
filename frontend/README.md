# Neusic Frontend

React 18 + Vite 6 + Tailwind CSS 3. Three screens: Onboarding → Session → Summary.

## Run

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` to the backend on port 8000.

For a production build:

```bash
npm run build && npm run preview
```

## Layout

```
frontend/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── main.jsx                  React entry point
    ├── App.jsx                   Screen state machine
    ├── api.js                    Typed wrappers for the 3 backend endpoints
    ├── index.css                 Tailwind directives + global body styles
    ├── pages/
    │   ├── Onboarding.jsx        Stress + subject + duration → /api/generate-session
    │   ├── Session.jsx           Orchestrates timer, music, entrainment, feedback
    │   └── Summary.jsx           Focus score ring + stats + check-in breakdown
    └── components/
        ├── StressSlider.jsx
        ├── SubjectSelector.jsx
        ├── DurationSelector.jsx
        ├── FocusTimer.jsx
        ├── FeedbackButtons.jsx
        └── EntrainmentLayer.jsx
```

## Component reference

| File                          | Responsibility                                                          |
| ----------------------------- | ----------------------------------------------------------------------- |
| `pages/Onboarding.jsx`        | Form: stress slider, subject tiles, duration picker. Calls `/api/generate-session` on submit. |
| `pages/Session.jsx`           | Owns the session clock, walks through `profile.focus_blocks`, calls `/api/adapt-session` on feedback, calls `/api/end-session` on completion. |
| `pages/Summary.jsx`           | Renders Claude's focus score in an animated SVG ring + the stats row + the insight/recommendation cards + a check-in breakdown chip set. |
| `components/EntrainmentLayer.jsx` | **The audio engineering.** Web Audio API binaural-beat generator. |
| `components/FocusTimer.jsx`   | Pure display — formats `secondsRemaining` as `mm:ss` + block label.    |
| `components/FeedbackButtons.jsx` | Three buttons: focused / losing / anxious.                          |
| `components/StressSlider.jsx` | 1–10 slider with the live value rendered in the display font.          |
| `components/SubjectSelector.jsx` | 2-column grid of subject tiles (Mathematics, Sciences, Essays, Memorization, Languages, Coding). |
| `components/DurationSelector.jsx` | 4-tile picker: 30 / 60 / 90 / 120 minutes.                          |

## How the audio engineering works

`EntrainmentLayer.jsx` is the technically distinctive piece. It runs entirely in the browser via the Web Audio API.

On first enable, it creates an `AudioContext` and two `OscillatorNode`s:

- **Left channel** — sine wave at `profile.carrier_hz` (default 200 Hz), routed through a `StereoPannerNode` with `pan = -1`.
- **Right channel** — sine wave at `profile.carrier_hz + profile.frequency_hz` (e.g. 200 + 10 = 210 Hz for alpha), routed through a panner with `pan = +1`.

Headphones required. The brain perceives the difference between the two channels (10 Hz for alpha, 16 Hz for beta, 6 Hz for theta) as the **entrainment beat**. Both oscillators feed a `GainNode` whose volume ramps smoothly to 6% on enable and to 0 on disable — so toggling pause is silent, not abrupt.

Frequency changes mid-session (from Claude's `/api/adapt-session` response) update `oscillator.frequency.setValueAtTime(...)` in place. The beat retunes live without restarting the audio graph.

## Theme

Tailwind config (`tailwind.config.js`) defines three colors derived from the Neusic pitch palette:

| Token    | Hex       | Use                                  |
| -------- | --------- | ------------------------------------ |
| `cream`  | `#f5efe6` | Page background, button surfaces     |
| `ink`    | `#1a1a1a` | Body text, primary action buttons    |
| `accent` | `#d9613a` | Submit buttons, focus-score ring, current-block highlight |

Fonts:

- **Display** — Fraunces (serif) for numbers, hero titles, focus score.
- **Body** — Inter for everything else.

Both loaded from Google Fonts in `index.html`.

## Known caveats

- **AudioContext autoplay** — Chrome and Safari require a user gesture before the `AudioContext` can produce sound. The "Generate my session" button click usually counts, but if you hear no entrainment beat under the music, hit **Pause then Resume** — that's a fresh gesture and unlocks the context.
- **YouTube embed autoplay** — same family of browser policy. Falls back to a user-clickable play button if autoplay is blocked.
- **No persistence** — refreshing mid-session loses state. Add a Supabase-backed session store if you want history.
