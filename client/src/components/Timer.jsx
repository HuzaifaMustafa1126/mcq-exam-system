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
  return (
    <span
      role="timer"
      aria-label="Time remaining"
      className="rounded-xl border border-[#c9b86a]/40 bg-[#14231a] px-4 py-2 font-mono text-lg font-bold text-[#f2e7a1]"
    >
      {seconds === null
        ? "--:--"
        : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
    </span>
  );
}
