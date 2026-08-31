import { Clock3, FileText, Play } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "./Card";
import Button from "./Button";
export default function ExamCard({ exam }) {
  const subject = exam.subject ?? exam.subjectName;
  const questions = exam.questions ?? exam.totalQuestions;
  const duration = exam.duration ?? exam.durationMinutes;
  return (
    <Card className="group overflow-hidden p-5 transition hover:-translate-y-0.5">
      <div className="-mx-5 -mt-5 mb-5 h-1 bg-[#c9b86a]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c9b86a]">
            {subject}
          </p>
          <h3 className="mt-2 text-lg font-bold">{exam.title}</h3>
        </div>
        <span className="rounded-full border border-[#c9b86a]/30 bg-[#1f5a3a]/35 px-2.5 py-1 text-xs text-[#f2e7a1]">
          {exam.status}
        </span>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-[#a8b2aa]">
        {exam.description ||
          `${exam.totalMarks} total marks · ${exam.passingMarks} to pass`}
      </p>
      <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#a8b2aa]">
        <span className="flex items-center gap-1.5">
          <FileText size={15} />
          {questions} questions
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 size={15} />
          {duration} min
        </span>
      </div>
      <Link to={`/exam/${exam.id}`} className="mt-6 block">
        <Button className="military-button w-full py-2.5">
          <Play size={16} />
          Start Exam
        </Button>
      </Link>
    </Card>
  );
}
