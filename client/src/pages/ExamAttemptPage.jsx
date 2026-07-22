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
      navigate(`/result/${data.resultId}`, { replace: true });
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
    return <p className="p-8 text-zinc-400">Loading secure exam…</p>;
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
          <p className="text-sm font-semibold text-cyan-300">
            EXAM IN PROGRESS
          </p>
          <h1 className="mt-1 text-2xl font-bold">{exam.data.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 font-mono font-bold text-cyan-200">
            {clock}
          </span>
          <button
            title="Fullscreen"
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"
          >
            <Maximize size={19} />
          </button>
        </div>
      </header>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          style={{ width: `${(answered / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_270px]">
        <div>
          <QuestionCard
            question={q}
            number={current + 1}
            selected={answers[q.id]}
            onSelect={(optionId) =>
              setAnswers((all) => ({ ...all, [q.id]: optionId }))
            }
          />
          <div className="mt-5 flex justify-between">
            <Button
              variant="secondary"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              <ChevronLeft size={17} />
              Previous
            </Button>
            {current === questions.length - 1 ? (
              <Button disabled={submit.isPending} onClick={submitNow}>
                <Send size={16} />
                {submit.isPending ? "Submitting…" : "Submit exam"}
              </Button>
            ) : (
              <Button onClick={() => setCurrent(current + 1)}>
                Next
                <ChevronRight size={17} />
              </Button>
            )}
          </div>
        </div>
        <aside className="glass h-fit rounded-2xl p-5">
          <p className="mb-3 text-xs font-semibold tracking-widest text-zinc-400">
            QUESTION PALETTE
          </p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrent(index)}
                className={`grid aspect-square place-items-center rounded-lg text-sm ${current === index ? "ring-2 ring-cyan-300 bg-cyan-400 text-zinc-950" : answers[question.id] ? "bg-violet-500/45 text-white" : "bg-white/5 text-zinc-400"}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-1 text-xs text-zinc-400">
            <p>
              <i className="mr-2 inline-block size-2 rounded bg-violet-400" />{" "}
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
