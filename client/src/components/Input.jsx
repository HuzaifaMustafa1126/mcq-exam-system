import { useId } from "react";
import FormError from "./FormError";
import clsx from "clsx";
export default function Input({ label, error, className, ...props }) {
  const errorId = useId();
  return (
    <label className="relative block">
      <span className="mb-2 block text-sm font-medium text-[#f5f5f0]">
        {label}
      </span>
      <input
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          "w-full rounded-xl border bg-[#0b1610] px-4 py-3.5 text-white outline-none transition placeholder:text-[#a8b2aa] focus:border-[#c9b86a] focus:ring-4 focus:ring-[#c9b86a]/10",
          error ? "border-[#c94a4a]" : "border-[#f2e7a1]/14",
          className,
        )}
        {...props}
      />
      <FormError id={errorId}>{error}</FormError>
    </label>
  );
}
