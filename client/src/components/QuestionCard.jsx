import { motion } from "framer-motion";
export default function QuestionCard({
  question,
  selected,
  onSelect,
  number,
  headerAccessory,
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 md:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#c9b86a]">
            Question {number} · {question.marks} mark
            {question.marks !== 1 ? "s" : ""}
          </p>
          <h2 className="mt-3 break-words text-xl font-semibold leading-relaxed md:text-2xl">
            {question.question}
          </h2>
        </div>
        {headerAccessory}
      </div>
      <div className="mt-7 space-y-3">
        {question.options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left text-sm transition ${selected === option.id ? "border-[#c9b86a] bg-[#1f5a3a]/55 text-[#f5f5f0]" : "border-[#f2e7a1]/14 bg-white/[.025] text-[#d7ddd7] hover:border-[#c9b86a]/55 hover:bg-[#1f5a3a]/20"}`}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-current text-xs font-bold">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="min-w-0 break-words">{option.text}</span>
          </button>
        ))}
      </div>
    </motion.article>
  );
}
