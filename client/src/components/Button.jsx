import { motion } from "framer-motion";
import clsx from "clsx";
export default function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
        variant === "primary"
          ? "bg-[#c9b86a] text-[#08110d] shadow-lg shadow-black/20 hover:bg-[#f2e7a1]"
          : "border border-[#f2e7a1]/20 bg-white/5 text-[#f5f5f0] hover:bg-[#1f5a3a]/35",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
