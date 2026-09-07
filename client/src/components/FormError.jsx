export default function FormError({ children, id }) {
  return children ? (
    <span id={id} role="alert" className="mt-1 block text-xs text-[#ffb1b1]">
      {children}
    </span>
  ) : null;
}
