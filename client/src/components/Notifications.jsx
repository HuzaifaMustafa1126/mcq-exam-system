import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "react-hot-toast";
export default function Notifications() {
  const [host, setHost] = useState(document.body);
  useEffect(() => {
    const update = () =>
      setHost(
        [...document.querySelectorAll("dialog[open]")].at(-1) || document.body,
      );
    window.addEventListener("mcq:dialog-change", update);
    return () => window.removeEventListener("mcq:dialog-change", update);
  }, []);
  return createPortal(
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 70 }}
      toastOptions={{
        duration: 4000,
        ariaProps: { role: "status", "aria-live": "polite" },
        style: {
          background: "#14231a",
          color: "#f5f5f0",
          border: "1px solid #c9b86a40",
        },
      }}
    />,
    host,
  );
}
