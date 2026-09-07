import Textarea from "../Textarea";
import Select from "../Select";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../Button";
import Input from "../Input";
import Modal from "../Modal";
import { getSubjects } from "../../services/subjects";

const defaults = {
  subjectId: "",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
  marks: 1,
  difficulty: "easy",
  status: "active",
};
const letters = ["A", "B", "C", "D"];

const fromQuestion = (question) => ({
  subjectId: question.subjectId,
  questionText: question.questionText,
  optionA: question.options?.[0]?.optionText || "",
  optionB: question.options?.[1]?.optionText || "",
  optionC: question.options?.[2]?.optionText || "",
  optionD: question.options?.[3]?.optionText || "",
  correctAnswer:
    letters[question.options?.findIndex((option) => option.isCorrect)] || "A",
  marks: question.marks,
  difficulty: question.difficulty,
  status: question.status,
});

export default function QuestionFormModal({
  open,
  question,
  onClose,
  onSubmit,
  isPending,
  subject,
}) {
  const { data: subjectsData } = useQuery({
    queryKey: ["subjects", "form"],
    queryFn: () => getSubjects({ page: 1, limit: 100 }),
    enabled: open && !subject,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: defaults });
  const [saveMode, setSaveMode] = useState("close");
  useEffect(() => {
    reset(
      question
        ? fromQuestion(question)
        : { ...defaults, subjectId: subject?.id || "" },
    );
  }, [question, open, reset, subject?.id]);
  const submit = async (values, event) => {
    const form = event.target;
    try {
      await onSubmit({
        subjectId: Number(subject?.id || values.subjectId),
        questionText: values.questionText,
        marks: Number(values.marks),
        difficulty: values.difficulty,
        status: values.status,
        options: letters.map((letter) => ({
          optionText: values[`option${letter}`],
          isCorrect: values.correctAnswer === letter,
        })),
      });
      if (saveMode === "another") {
        reset({
          ...defaults,
          subjectId: subject?.id || values.subjectId,
          marks: values.marks,
          difficulty: values.difficulty,
          status: values.status,
          correctAnswer: "",
        });
        requestAnimationFrame(() =>
          form.querySelector('[name="questionText"]')?.focus(),
        );
      } else onClose();
    } catch {
      /* Mutation displays the error; preserve the draft. */
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isPending}
      title={question?.id ? "Edit question" : "Add question"}
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {subject ? (
          <p className="rounded-xl border border-[#c9b86a]/30 p-3">
            Subject: <strong>{subject.name}</strong> · {subject.code}
          </p>
        ) : (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">
              Subject
            </span>
            <Select
              className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3.5 text-white outline-none focus:border-cyan-400/70"
              {...register("subjectId", { required: "Subject is required" })}
            >
              <option value="">Select a subject</option>
              {subjectsData?.subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </Select>
            {errors.subjectId && (
              <span className="mt-1 block text-xs text-rose-400">
                {errors.subjectId.message}
              </span>
            )}
          </label>
        )}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">
            Question text
          </span>
          <Textarea
            rows="3"
            className="w-full resize-y rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-white outline-none focus:border-cyan-400/70"
            placeholder="Write the question..."
            {...register("questionText", {
              required: "Question text is required",
            })}
          />
          {errors.questionText && (
            <span className="mt-1 block text-xs text-rose-400">
              {errors.questionText.message}
            </span>
          )}
        </label>
        <div className="space-y-2">
          {letters.map((letter) => (
            <label
              key={letter}
              className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 text-sm"
            >
              <span>Option {letter}</span>
              <div>
                <input
                  aria-label={`Option ${letter}`}
                  {...register(`option${letter}`, {
                    required: `Option ${letter} is required`,
                  })}
                />
                {errors[`option${letter}`] && (
                  <p role="alert" className="text-xs text-rose-300">
                    {errors[`option${letter}`].message}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
        <fieldset>
          <legend className="mb-2 text-sm">Correct Answer</legend>
          <div className="flex gap-3">
            {letters.map((letter) => (
              <label
                key={letter}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#c9b86a]/30 px-4 py-2 has-checked:bg-[#1f5a3a]"
              >
                <input
                  type="radio"
                  value={letter}
                  aria-label={`Mark option ${letter} as correct`}
                  {...register("correctAnswer", {
                    required: "Choose the correct answer",
                  })}
                />
                {letter}
              </label>
            ))}
          </div>
        </fieldset>
        {errors.correctAnswer && (
          <p role="alert" className="text-sm text-rose-300">
            {errors.correctAnswer.message}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Marks"
            type="number"
            min="0.01"
            step="0.01"
            error={errors.marks?.message}
            {...register("marks", {
              required: "Marks are required",
              min: { value: 0.01, message: "Marks must be greater than zero" },
            })}
          />
          <Select label="Difficulty" {...register("difficulty")}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Select label="Status" {...register("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="dialog-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          {!question?.id && (
            <Button
              type="submit"
              disabled={isPending}
              onClick={() => {
                setSaveMode("another");
              }}
            >
              Save & Add Another
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            onClick={() => {
              setSaveMode("close");
            }}
          >
            {isPending
              ? "Saving..."
              : question?.id
                ? "Save changes"
                : "Save & Close"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
