import clsx from "clsx";
export default function Skeleton({ className }) {
  return (
    <div
      className={clsx("animate-pulse rounded-xl bg-[#1f5a3a]/35", className)}
    />
  );
}
