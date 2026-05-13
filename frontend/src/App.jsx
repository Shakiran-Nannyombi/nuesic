import { useState } from "react";
import Onboarding from "./pages/Onboarding.jsx";
import Session from "./pages/Session.jsx";
import Summary from "./pages/Summary.jsx";

export default function App() {
  const [screen, setScreen] = useState("onboarding");
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);

  if (screen === "onboarding") {
    return (
      <Onboarding
        onSessionGenerated={(p) => {
          setProfile(p);
          setScreen("session");
        }}
      />
    );
  }

  if (screen === "session") {
    return (
      <Session
        profile={profile}
        onEnd={(s) => {
          setSummary(s);
          setScreen("summary");
        }}
      />
    );
  }

  return (
    <Summary
      summary={summary}
      onRestart={() => {
        setProfile(null);
        setSummary(null);
        setScreen("onboarding");
      }}
    />
  );
}
