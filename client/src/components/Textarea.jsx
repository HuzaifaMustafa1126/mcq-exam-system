export default function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full resize-y rounded-xl border border-[#c9b86a]/25 bg-[#0b1610] px-3 py-2.5 text-white focus:border-[#c9b86a] ${className}`}
      {...props}
    />
  );
}
