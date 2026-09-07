import { useEffect, useState } from "react";
export default function Timer({ expiresAt, serverNow, receivedAt, onExpire }) {
  const [seconds, setSeconds] = useState(null);
  useEffect(() => {
    const duration = Math.max(
      0,
      new Date(expiresAt).getTime() - new Date(serverNow).getTime(),
    );
    const tick = () => {
      const next = Math.max(
        0,
        Math.ceil((duration - (performance.now() - receivedAt)) / 1000),
      );
      setSeconds(next);
      if (next === 0) onExpire();
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [expiresAt, serverNow, receivedAt, onExpire]);
  const warning = seconds !== null && seconds <= 60;
  const urgent = seconds !== null && seconds <= 300;
  return (
    <span
      role="timer"
      aria-label="Time remaining"
      className={`shrink-0 rounded-xl border px-3 py-1.5 font-mono text-sm font-bold ${warning ? "animate-pulse border-[#c94a4a] bg-[#c94a4a]/20 text-[#ffd0d0]" : urgent ? "border-[#c9b86a] bg-[#c9b86a]/15 text-[#f2e7a1]" : "border-[#c9b86a]/40 bg-[#14231a] text-[#f2e7a1]"}`}
    >
      {seconds === null
        ? "--:--"
        : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
    </span>
  );
}
