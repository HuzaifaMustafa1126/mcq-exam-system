import FormError from "./FormError";
import { useId } from "react";
export default function Select({
  label,
  error,
  children,
  className = "",
  ...props
}) {
  const id = useId();
  const field = (
    <select
      id={props.id || id}
      aria-label={props["aria-label"] || label}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`academy-select ${className}`}
      {...props}
    >
      {children}
    </select>
  );
  return label ? (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {field}
      <FormError id={`${id}-error`}>{error}</FormError>
    </label>
  ) : (
    field
  );
}
