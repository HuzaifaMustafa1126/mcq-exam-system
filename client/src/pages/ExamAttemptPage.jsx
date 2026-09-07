import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/Button";
import QuestionCard from "../components/QuestionCard";
import Timer from "../components/Timer";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  getStudentQuestions,
  saveStudentAnswer,
  submitStudentExam,
} from "../services/student";

export default function ExamAttemptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = useQuery({
    queryKey: ["student-session", id],
    queryFn: () => getStudentQuestions(id, 1),
    retry: false,
    refetchOnWindowFocus: false,
  });
  if (exam.isPending) return <p className="p-8">Loading secure exam…</p>;
  if (exam.isError)
    return (
      <div className="glass rounded-xl p-8">
        <p>
          {exam.error.response?.status === 404
            ? "Exam is no longer available."
            : exam.error.response?.data?.message || "Unable to load exam."}
        </p>
        {exam.error.response?.status === 404 ? (
          <Button onClick={() => navigate("/exams")}>Back to Exams</Button>
        ) : (
          <Button onClick={() => exam.refetch()}>Retry</Button>
        )}
      </div>
    );
  return (
    <ExamSession
      key={`${id}-${exam.data.attemptId}`}
      id={id}
      initial={exam.data}
    />
  );
}
function ExamSession({ id, initial }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(initial.answers || {});
  const [expired, setExpired] = useState(initial.status === "TIME_COMPLETED");
  const [finished, setFinished] = useState(initial.status === "SUBMITTED");
  const readOnly = expired || finished;
  const [review, setReview] = useState(new Set());
  const [visited, setVisited] = useState(new Set([0]));
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState("Saved");
  const key = `mcq-pending-attempt-${initial.attemptId}`;
  const [restoredQueue] = useState(() => {
    try {
      return new Map(JSON.parse(sessionStorage.getItem(key)) || []);
    } catch {
      return new Map();
    }
  });
  const pending = useRef(restoredQueue);
  const busy = useRef(false);
  const locked = useRef(readOnly);
  const expire = useCallback(() => {
    locked.current = true;
    setExpired(true);
  }, []);
  const finish = useCallback(() => { locked.current = true; setFinished(true); }, []);
  const page = useQuery({
    queryKey: ["student-question-page", id, initial.attemptId, current],
    queryFn: ({ signal }) => getStudentQuestions(id, current + 1, signal),
    initialData: current === 0 ? initial : undefined,
    refetchInterval: 15000,
  });
  const refetchPage = page.refetch;
  useEffect(() => {
    if (expired) void refetchPage();
  }, [expired, refetchPage]);
  const data = page.data || initial;
  const q = page.data?.questions[0];
  const total = initial.totalQuestions;
  const persistQueue = useCallback(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify([...pending.current]));
    } catch {
      /* Server saves still work when storage is unavailable. */
    }
  }, [key]);
  const drain = useCallback(async () => {
    if (busy.current) return false;
    busy.current = true;
    try {
      while (pending.current.size && !locked.current) {
        const [questionId, optionId] = pending.current.entries().next().value;
        setSaveState("Saving…");
        await saveStudentAnswer({
          id,
          attemptId: initial.attemptId,
          questionId,
          optionId,
        });
        if (pending.current.get(questionId) === optionId)
          pending.current.delete(questionId);
        persistQueue();
      }
      setSaveState(
        pending.current.size
          ? "Some answers were not saved before time ended."
          : "Saved",
      );
      return pending.current.size === 0;
    } catch (error) {
      if (error.response?.data?.code === "EXAM_TIME_COMPLETED") expire();
      if (error.response?.data?.code === "EXAM_ALREADY_SUBMITTED") finish();
      setSaveState(
        error.response
          ? error.response.data.message || "Unable to save answer"
          : "Connection lost. Your answers will be saved when connection returns, while time remains.",
      );
      return false;
    } finally {
      busy.current = false;
    }
  }, [id, initial.attemptId, persistQueue, expire, finish]);
  useEffect(() => {
    const retry = () => {
      void drain();
    };
    retry();
    window.addEventListener("online", retry);
    const timer = setInterval(retry, 3000);
    return () => {
      window.removeEventListener("online", retry);
      clearInterval(timer);
    };
  }, [drain]);
  useEffect(() => {
    if (!page.data) return;
    // Synchronize server-accepted answers across refreshes/tabs; retain only this tab's queued edits.
    const timer = setTimeout(() => {
      if (page.data.status === "TIME_COMPLETED") expire();
      if (page.data.status === "SUBMITTED") finish();
      setAnswers({
        ...page.data.answers,
        ...(!locked.current ? Object.fromEntries(pending.current) : {}),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [page.data, expire, finish]);
  useEffect(() => {
    if (page.isError && page.error?.response?.status === 404) {
      toast.error("Exam is no longer available.");
      navigate("/exams", { replace: true });
    }
  }, [page.isError, page.error, navigate]);
  useEffect(() => {
    const warn = (event) => {
      if (pending.current.size) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const select = (optionId) => {
    if (locked.current || submitting || !q) return;
    if (answers[q.id] === optionId) return;
    setAnswers((all) => ({ ...all, [q.id]: optionId }));
    pending.current.set(q.id, optionId);
    persistQueue();
    void drain();
  };
  const go = (index) => {
    setCurrent(index);
    setVisited((all) => new Set([...all, index]));
    setDrawer(false);
  };
  const submit = async () => {
    if (submitting) return;
    if (busy.current) { toast.error("Please wait for the current answer to save."); return; }
    setSubmitting(true);
    try {
      if (!expired && !(await drain())) {
        toast.error("Wait for your answers to save before submitting.");
        return;
      }
      const result = await submitStudentExam({
        id,
        attemptId: initial.attemptId,
      });
      sessionStorage.removeItem(key);
      toast.success("Exam submitted successfully.");
      navigate(`/result/${result.attemptId}`, { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to submit exam. Please retry.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const answered = Object.values(answers).filter(Boolean).length;
  const navigator = (
    <>
      <h2 className="mb-3 font-semibold text-[#c9b86a]">Question Navigator</h2>
      <div className="question-palette-scroll grid max-h-100 grid-cols-5 gap-2 overflow-y-auto p-1">
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index}
            onClick={() => go(index)}
            aria-current={current === index ? "step" : undefined}
            aria-label={`Question ${index + 1}${review.has(index) ? ", marked for review" : ""}`}
            className={`h-10 rounded-lg text-sm ${current === index ? "bg-[#c9b86a] text-[#08110d]" : data.questionIds?.[index] && answers[data.questionIds[index]] ? "bg-[#1f5a3a]" : visited.has(index) ? "bg-white/15" : "bg-white/5"} ${review.has(index) ? "ring-2 ring-[#c9b86a]" : ""}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs leading-6 text-[#a8b2aa]">
        ● Answered · ○ Unanswered · ◇ Review
        <br />
        Gold: current · Light: visited
      </p>
    </>
  );
  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#c9b86a]">
            {finished ? "EXAM SUBMITTED" : expired ? "TIME COMPLETED" : "EXAM IN PROGRESS"}
          </p>
          <h1 className="text-2xl font-bold">{initial.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await document.documentElement.requestFullscreen();
              } catch {
                toast.error("Fullscreen is unavailable.");
              }
            }}
          >
            Fullscreen
          </Button>
        </div>
      </header>
      {expired && !finished && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-[#c9b86a] bg-[#c9b86a]/10 p-5"
        >
          <strong>TIME COMPLETED</strong>
          <p>
            Your exam time has ended. Your answers are now locked. Please submit
            your exam to finish the attempt.
          </p>
        </div>
      )}
      <p className="mb-2 text-sm">
        Question {current + 1} of {total} · Answered: {answered} / {total}
      </p>
      <div className="mb-5 h-2 rounded bg-white/10">
        <div
          className="h-full rounded bg-[#c9b86a]"
          style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
        />
      </div>
      <p role="status" className="mb-4 text-sm text-[#c9b86a]">
        {saveState}
      </p>
      <Button
        variant="secondary"
        className="mb-4 lg:hidden"
        onClick={() => setDrawer(true)}
      >
        Questions
      </Button>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="min-w-0">
          {q ? (
            <QuestionCard
              question={q}
              number={current + 1}
              selected={answers[q.id]}
              headerAccessory={
                <Timer
                  expiresAt={data.expiresAt}
                  serverNow={data.serverNow}
                  receivedAt={data.receivedAt}
                  onExpire={expire}
                />
              }
              onSelect={select}
              disabled={readOnly || submitting}
            />
          ) : (
            <p className="glass rounded-xl p-8">
              {page.isError ? "Unable to load question." : "Loading question…"}
              {page.isError && (
                <Button onClick={() => page.refetch()}>Retry</Button>
              )}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={readOnly || submitting || current === 0}
              onClick={() => go(current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={readOnly || submitting || current >= total - 1}
              onClick={() => go(current + 1)}
            >
              Next
            </Button>
            <Button
              variant="secondary"
              disabled={readOnly || submitting || !q}
              onClick={() => select(null)}
            >
              Clear answer
            </Button>
            <Button
              variant="secondary"
              disabled={readOnly || submitting}
              onClick={() =>
                setReview((all) => {
                  const next = new Set(all);
                  next.has(current) ? next.delete(current) : next.add(current);
                  return next;
                })
              }
            >
              {review.has(current) ? "Unmark review" : "Mark for review"}
            </Button>
            <Button disabled={submitting} onClick={() => finished ? navigate(`/result/${initial.attemptId}`) : setConfirm(true)}>
              {finished ? "View Result" : "Submit Exam"}
            </Button>
          </div>
        </section>
        <aside className="glass hidden rounded-xl p-4 lg:block">
          {navigator}
        </aside>
      </div>
      <Modal open={drawer} onClose={() => setDrawer(false)} title="Questions">
        {navigator}
      </Modal>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={expired ? "Time Completed" : "Submit Exam?"}
        confirmLabel="Submit Exam"
        onConfirm={submit}
        pending={submitting}
      >
        <p>
          {expired
            ? "Your allowed exam time has ended."
            : "Are you ready to finish your attempt?"}
        </p>
        <p>
          Answered: {answered} · Unanswered: {total - answered}
        </p>
        <p>After submission, your answers cannot be changed.</p>
        {expired && saveState !== "Saved" && (
          <p>
            Only answers saved by the server before time ended will be graded.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
