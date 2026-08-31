import { LoaderCircle } from "lucide-react";
export default function Loader({ text = "Loading..." }) {
  return (
    <div
      className="flex min-h-48 items-center justify-center gap-3 text-[#a8b2aa]"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="animate-spin text-[#c9b86a]"
        size={22}
        aria-hidden="true"
      />
      <span>{text}</span>
    </div>
  );
}
