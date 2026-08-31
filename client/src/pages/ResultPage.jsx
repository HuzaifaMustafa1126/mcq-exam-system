import { CheckCircle2, Printer, Trophy, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { getStudentResult } from "../services/student";

export default function ResultPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["student-result", id],
    queryFn: () => getStudentResult(id),
  });
  if (query.isLoading)
    return <p className="p-8 text-[#a8b2aa]">Loading result…</p>;
  if (query.isError)
    return (
      <div className="glass mx-auto max-w-xl rounded-2xl p-8">
        Result not found.
      </div>
    );
  const r = query.data;
  const passed = r.status === "PASS";
  const facts = [
    ["Correct answers", r.correct, CheckCircle2, "text-[#a9e4ba]"],
    ["Wrong answers", r.wrong, XCircle, "text-[#ffb1b1]"],
    ["Skipped", r.unanswered, Trophy, "text-[#f2e7a1]"],
  ];
  return (
    <div className="mx-auto max-w-4xl py-4">
      <header className="text-center">
        <p className="text-sm font-semibold tracking-widest text-[#c9b86a]">
          EXAM COMPLETE
        </p>
        <h1 className="mt-2 text-3xl font-bold">{r.examName}</h1>
        <p className="mt-2 text-[#a8b2aa]">
          {r.studentName} · {r.subjectName}
        </p>
      </header>
      <Card className="mt-8 overflow-hidden p-7 md:p-10">
        <div className="flex flex-col items-center gap-7 md:flex-row">
          <div className="grid size-44 place-items-center rounded-full border-[12px] border-[#c9b86a]/45 bg-[#1f5a3a]/20">
            <div className="text-center">
              <p className="text-4xl font-black">{r.percentage}%</p>
              <p className="text-xs text-[#a8b2aa]">Your score</p>
            </div>
          </div>
          <div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${passed ? "bg-[#4caf70]/15 text-[#a9e4ba]" : "bg-[#c94a4a]/15 text-[#ffb1b1]"}`}
            >
              {r.status}
            </span>
            <h2 className="mt-3 text-2xl font-bold">
              {r.obtainedMarks} / {r.totalMarks} marks
            </h2>
            <p className="mt-2 text-[#a8b2aa]">
              {r.correct} correct out of {r.totalQuestions} questions.
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {facts.map(([label, value, Icon, color]) => (
            <div
              key={label}
              className="rounded-xl border border-[#f2e7a1]/14 bg-white/[.025] p-4"
            >
              <Icon className={color} size={19} />
              <p className="mt-4 text-xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-[#a8b2aa]">{label}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/results">
          <Button className="military-secondary" variant="secondary">
            All results
          </Button>
        </Link>
        <Button className="military-button" onClick={() => window.print()}>
          <Printer size={16} />
          Print result
        </Button>
      </div>
    </div>
  );
}
