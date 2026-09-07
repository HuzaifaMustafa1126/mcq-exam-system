import Textarea from "../Textarea";
import Select from "../Select";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Button from "../Button";
import Input from "../Input";
import Modal from "../Modal";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { getQuestions } from "../../services/questions";
import { getSubjects } from "../../services/subjects";

const defaultValues = {
  title: "",
  subjectId: "",
  description: "",
  durationMinutes: 60,
  passingMarks: 0,
  maxAttempts: 1,
  startTime: "",
  endTime: "",
  status: "draft",
};
const steps = ["Details", "Rules", "Questions", "Schedule", "Review"];
const dateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function ExamWizardModal({
  open,
  exam,
  onClose,
  onSubmit,
  isPending,
}) {
  const [step, setStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedMarksById, setSelectedMarksById] = useState(new Map());
  const [questionPage, setQuestionPage] = useState(1);
  const [questionSearch, setQuestionSearch] = useState("");
  const debouncedSearch = useDebouncedValue(questionSearch);
  const [difficulty, setDifficulty] = useState("");
  const {
    control,
    register,
    trigger,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
  });
  const subjectId = useWatch({ control, name: "subjectId" });
  const { data: subjectData } = useQuery({
    queryKey: ["subjects", "exam-form"],
    queryFn: () => getSubjects({ page: 1, limit: 100 }),
    enabled: open,
  });
  const { data: questionsData, isPending: questionsPending } = useQuery({
    queryKey: [
      "questions",
      "exam-form",
      subjectId,
      difficulty,
      debouncedSearch,
      questionPage,
    ],
    queryFn: ({ signal }) =>
      getQuestions(
        {
          page: questionPage,
          limit: 25,
          subjectId: subjectId || undefined,
          difficulty: difficulty || undefined,
          search: debouncedSearch || undefined,
        },
        signal,
      ),
    enabled: open && step === 2 && Boolean(subjectId),
  });
  // Opening a different exam intentionally resets the wizard's local draft state.
  useEffect(() => {
    const assigned = exam?.assignedQuestions || [];
    reset(
      exam
        ? {
            ...exam,
            startTime: dateValue(exam.startTime),
            endTime: dateValue(exam.endTime),
          }
        : defaultValues,
    );
    // Resetting the wizard draft is intentional when a different exam opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds(new Set(assigned.map((question) => question.id)));
    setSelectedMarksById(
      new Map(
        assigned.map((question) => [question.id, Number(question.marks)]),
      ),
    );
    setQuestionPage(1);
    setStep(0);
    setQuestionSearch("");
    setDifficulty("");
  }, [exam, open, reset]);
  const selectedMarks = useMemo(
    () =>
      [...selectedIds].reduce(
        (total, id) => total + Number(selectedMarksById.get(id) || 0),
        0,
      ),
    [selectedIds, selectedMarksById],
  );
  const next = async () => {
    const fields =
      step === 0
        ? ["title", "subjectId"]
        : step === 1
          ? ["durationMinutes", "passingMarks", "maxAttempts"]
          : step === 3
            ? ["startTime", "endTime"]
            : [];
    if (fields.length && !(await trigger(fields))) return;
    if (step === 2 && selectedIds.size === 0) return;
    setStep((current) => Math.min(current + 1, 4));
  };
  const toggle = (id, marks) => {
    setSelectedIds((current) => {
      const nextSet = new Set(current);
      nextSet.has(id) ? nextSet.delete(id) : nextSet.add(id);
      return nextSet;
    });
    setSelectedMarksById((current) => {
      const nextMap = new Map(current);
      nextMap.has(id) ? nextMap.delete(id) : nextMap.set(id, Number(marks));
      return nextMap;
    });
  };
  const finish = () => {
    const values = getValues();
    onSubmit({
      ...values,
      subjectId: Number(values.subjectId),
      durationMinutes: Number(values.durationMinutes),
      passingMarks: Number(values.passingMarks),
      maxAttempts: Number(values.maxAttempts),
      totalMarks: selectedMarks,
      startTime: values.startTime
        ? new Date(values.startTime).toISOString()
        : null,
      endTime: values.endTime ? new Date(values.endTime).toISOString() : null,
      questionIds: [...selectedIds],
    });
  };
  return (
    <Modal
      busy={isPending}
      open={open}
      onClose={onClose}
      title={exam?.id ? "Edit exam" : "Create exam"}
    >
      <div className="mb-6 flex overflow-x-auto pb-1">
        {steps.map((label, index) => (
          <div key={label} className="flex min-w-22 items-center">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index <= step ? "bg-cyan-400 text-zinc-950" : "bg-white/10 text-zinc-500"}`}
            >
              {index < step ? <Check size={15} /> : index + 1}
            </span>
            <span
              className={`ml-2 text-xs ${index === step ? "text-white" : "text-zinc-500"}`}
            >
              {label}
            </span>
            {index < 4 && <span className="mx-2 h-px flex-1 bg-white/10" />}
          </div>
        ))}
      </div>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mb-4 text-sm text-rose-300">
          {Object.entries(errors)
            .map(([field, error]) => error.message || `Check ${field}`)
            .join(". ")}
        </p>
      )}
      {step === 0 && (
        <div className="space-y-4">
          <Input
            label="Exam title"
            error={undefined}
            {...register("title", {
              required: "Exam title is required",
              minLength: 2,
            })}
          />
          <Select
            label="Subject"
            {...register("subjectId", {
              required: "Subject is required",
              onChange: () => {
                setSelectedIds(new Set());
                setSelectedMarksById(new Map());
                setQuestionPage(1);
              },
            })}
          >
            <option value="">Select a subject</option>
            {subjectData?.subjects?.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </Select>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">
              Description
            </span>
            <Textarea
              rows="4"
              className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-white outline-none focus:border-cyan-400/70"
              {...register("description")}
            />
          </label>
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Duration (minutes)"
            type="number"
            min="1"
            {...register("durationMinutes", { required: true, min: 1 })}
          />
          <Input
            label="Pass marks"
            type="number"
            min="0"
            step="0.01"
            {...register("passingMarks", { required: true, min: 0 })}
          />
          <Input
            label="Maximum attempts"
            type="number"
            min="1"
            {...register("maxAttempts", { required: true, min: 1 })}
          />
        </div>
      )}
      {step === 2 && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={17}
              />
              <input
                value={questionSearch}
                onChange={(event) => {
                  setQuestionSearch(event.target.value);
                  setQuestionPage(1);
                }}
                placeholder="Search available questions"
                className="w-full rounded-xl border border-white/10 bg-zinc-950/60 py-2.5 pl-9 pr-3 text-sm text-white outline-none"
              />
            </div>
            <Select
              value={difficulty}
              onChange={(event) => {
                setDifficulty(event.target.value);
                setQuestionPage(1);
              }}
              className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-white"
            >
              <option value="">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={questionPage <= 1}
              onClick={() => setQuestionPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              Page {questionPage} / {questionsData?.pagination?.totalPages || 1}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={
                !questionsData ||
                questionPage >= questionsData.pagination.totalPages
              }
              onClick={() => setQuestionPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
          <p className="mb-3 text-sm text-cyan-300">
            {selectedIds.size} selected · {selectedMarks} total marks
          </p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {questionsPending ? (
              <p className="text-sm text-zinc-500">Loading questions...</p>
            ) : (
              questionsData?.questions?.map((question) => (
                <label
                  key={question.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(question.id)}
                    onChange={() => toggle(question.id, question.marks)}
                    className="mt-1 size-4 accent-cyan-400"
                  />
                  <span className="min-w-0 flex-1 text-sm text-zinc-300">
                    {question.questionText}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {question.marks} marks
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <Input
            label="Start date & time"
            type="datetime-local"
            {...register("startTime")}
          />
          <Input
            label="End date & time"
            type="datetime-local"
            {...register("endTime")}
          />
          <Select label="Save as" {...register("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </div>
      )}
      {step === 4 && (
        <Review
          values={getValues()}
          selectedCount={selectedIds.size}
          totalMarks={selectedMarks}
        />
      )}
      <div className="dialog-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={
            step === 0 ? onClose : () => setStep((current) => current - 1)
          }
        >
          {step === 0 ? (
            "Cancel"
          ) : (
            <>
              <ChevronLeft size={16} />
              Back
            </>
          )}
        </Button>
        {step === 4 ? (
          <Button type="button" onClick={finish} disabled={isPending}>
            {isPending ? "Saving..." : exam?.id ? "Save exam" : "Create exam"}
          </Button>
        ) : (
          <Button type="button" onClick={next}>
            Next
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </Modal>
  );
}
function Review({ values, selectedCount, totalMarks }) {
  return (
    <div className="space-y-3">
      <Row label="Title" value={values.title} />
      <Row label="Subject" value={values.subjectId} />
      <Row label="Duration" value={`${values.durationMinutes} minutes`} />
      <Row label="Questions" value={selectedCount} />
      <Row label="Total marks" value={totalMarks} />
      <Row label="Pass marks" value={values.passingMarks} />
      <Row label="Status" value={values.status} />
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between rounded-xl bg-white/[.03] px-4 py-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="capitalize text-zinc-200">{value || "—"}</span>
    </div>
  );
}
