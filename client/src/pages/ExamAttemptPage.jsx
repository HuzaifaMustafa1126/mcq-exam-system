import { ChevronLeft, ChevronRight, Maximize, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/Button";
import QuestionCard from "../components/QuestionCard";
import { getStudentQuestions, submitStudentExam } from "../services/student";

const storageKey = (id) => `mcq-exam-${id}-answers`;
export default function ExamAttemptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const exam = useQuery({
    queryKey: ["student-questions", id],
    queryFn: () => getStudentQuestions(id),
    retry: false,
  });
  const [answers, setAnswers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey(id))) || {};
    } catch {
      return {};
    }
  });
  const questions = exam.data?.questions || [];
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!exam.data?.expiresAt) return undefined;
    const expiresAt = new Date(exam.data.expiresAt).getTime();
    const timer = setInterval(
      () =>
        setRemaining(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))),
      1000,
    );
    return () => clearInterval(timer);
  }, [exam.data?.expiresAt]);
  useEffect(() => {
    localStorage.setItem(storageKey(id), JSON.stringify(answers));
  }, [answers, id]);
  const submit = useMutation({
    mutationFn: () =>
      submitStudentExam({
        id,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId: Number(questionId),
          optionId,
        })),
      }),
    onSuccess: (data) => {
      localStorage.removeItem(storageKey(id));
      toast.success("Exam submitted");
      navigate(`/result/${data.attemptId ?? data.resultId}`, { replace: true });
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Unable to submit exam"),
  });
  useEffect(() => {
    if (
      exam.data &&
      remaining !== null &&
      remaining <= 1 &&
      !submit.isPending &&
      !submit.isSuccess
    )
      submit.mutate();
  }, [remaining, exam.data, submit]);
  if (exam.isLoading)
    return <p className="p-8 text-[#a8b2aa]">Loading secure exam…</p>;
  if (exam.isError || !questions.length)
    return (
      <div className="glass mx-auto max-w-xl rounded-2xl p-8">
        This exam session is unavailable or has expired.
      </div>
    );
  const q = questions[current];
  const answered = Object.keys(answers).length;
  const clock =
    remaining === null
      ? "--:--"
      : `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const clockClass = `rounded-xl border px-4 py-2 font-mono font-bold ${remaining !== null && remaining < 300 ? "border-[#c94a4a]/50 bg-[#c94a4a]/15 text-[#ffd0d0]" : "border-[#c9b86a]/30 bg-[#1f5a3a]/25 text-[#f2e7a1]"}`;
  const submitNow = () => {
    if (
      window.confirm(
        `Submit exam with ${answered} of ${questions.length} questions answered?`,
      )
    )
      submit.mutate();
  };
  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-widest text-[#c9b86a]">
            EXAM IN PROGRESS
          </p>
          <h1 className="mt-1 text-2xl font-bold">{exam.data.title}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`${clockClass} lg:hidden min-[1440px]:inline`}>
            {clock}
          </span>
          <button
            title="Fullscreen"
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="rounded-lg p-2 text-[#a8b2aa] hover:bg-white/5"
          >
            <Maximize size={19} />
          </button>
        </div>
      </header>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          style={{ width: `${(answered / questions.length) * 100}%` }}
          className="h-full bg-[#c9b86a]"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_64px] min-[1440px]:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <QuestionCard
            question={q}
            number={current + 1}
            selected={answers[q.id]}
            headerAccessory={
              <span
                className={`${clockClass} hidden shrink-0 lg:inline min-[1440px]:hidden`}
              >
                {clock}
              </span>
            }
            onSelect={(optionId) =>
              setAnswers((all) => ({ ...all, [q.id]: optionId }))
            }
          />
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="secondary"
              className="military-secondary"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              <ChevronLeft size={17} />
              Previous
            </Button>
            {current === questions.length - 1 ? (
              <Button
                className="military-button"
                disabled={submit.isPending}
                onClick={submitNow}
              >
                <Send size={16} />
                {submit.isPending ? "Submitting…" : "Submit exam"}
              </Button>
            ) : (
              <Button
                className="military-button"
                onClick={() => setCurrent(current + 1)}
              >
                Next
                <ChevronRight size={17} />
              </Button>
            )}
          </div>
        </div>
        <aside className="glass h-fit rounded-2xl p-5 lg:p-3 min-[1440px]:p-5">
          <p className="mb-3 text-xs font-semibold tracking-widest text-[#c9b86a] lg:hidden min-[1440px]:block">
            QUESTION PALETTE
          </p>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-1 min-[1440px]:grid-cols-5">
            {questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrent(index)}
                className={`grid aspect-square place-items-center rounded-lg text-sm ${current === index ? "ring-2 ring-[#f2e7a1] bg-[#c9b86a] text-[#08110d]" : answers[question.id] ? "bg-[#1f5a3a] text-white" : "bg-white/5 text-[#a8b2aa]"}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-1 text-xs text-[#a8b2aa] lg:hidden min-[1440px]:block">
            <p>
              <i className="mr-2 inline-block size-2 rounded bg-[#1f5a3a]" />{" "}
              Answered
            </p>
            <p>
              <i className="mr-2 inline-block size-2 rounded bg-white/20" /> Not
              answered
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
