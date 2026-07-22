import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FilePenLine,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import toast from "react-hot-toast";
import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";
import Skeleton from "../components/Skeleton";
import ExamPreviewModal from "../components/exams/ExamPreviewModal";
import ExamWizardModal from "../components/exams/ExamWizardModal";
import {
  assignExamQuestions,
  createExam,
  deleteExam,
  getExam,
  getExamQuestions,
  getExams,
  removeExamQuestion,
  updateExam,
} from "../services/exams";
import { getSubjects } from "../services/subjects";

const SIZE = 10;
const initialFilters = { subjectId: "", status: "" };
const date = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const errorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export default function ExamsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [wizardExam, setWizardExam] = useState(undefined);
  const [previewId, setPreviewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deferredSearch = useDeferredValue(search);
  const client = useQueryClient();
  const params = {
    page,
    limit: SIZE,
    search: deferredSearch || undefined,
    subjectId: filters.subjectId || undefined,
    status: filters.status || undefined,
  };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["exams", params],
    queryFn: () => getExams(params),
  });
  const { data: subjects } = useQuery({
    queryKey: ["subjects", "exam-filter"],
    queryFn: () => getSubjects({ page: 1, limit: 100 }),
  });
  const invalidate = () => client.invalidateQueries({ queryKey: ["exams"] });
  const saveMutation = useMutation({
    mutationFn: async ({ exam, payload }) => {
      const { questionIds, ...examPayload } = payload;
      if (!exam?.id) {
        const created = await createExam(examPayload);
        try {
          if (questionIds.length)
            await assignExamQuestions({ id: created.id, questionIds });
          return created;
        } catch (error) {
          await deleteExam(created.id).catch(() => {});
          throw error;
        }
      }
      const updated = await updateExam({ id: exam.id, payload: examPayload });
      const currentIds = new Set(
        exam.assignedQuestions.map((question) => question.id),
      );
      const nextIds = new Set(questionIds);
      const add = questionIds.filter((id) => !currentIds.has(id));
      const remove = exam.assignedQuestions.filter(
        (question) => !nextIds.has(question.id),
      );
      if (add.length)
        await assignExamQuestions({ id: exam.id, questionIds: add });
      for (const question of remove)
        await removeExamQuestion({ id: exam.id, questionId: question.id });
      return updated;
    },
    onSuccess: (_value, variables) => {
      toast.success(
        variables.exam?.id
          ? "Exam updated successfully"
          : "Exam created successfully",
      );
      setWizardExam(undefined);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, "Unable to save exam")),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      toast.success("Exam deleted successfully");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Unable to delete exam")),
  });
  const statusMutation = useMutation({
    mutationFn: updateExam,
    onSuccess: () => {
      toast.success("Exam status updated");
      invalidate();
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Unable to update status")),
  });
  const exams = data?.exams || [];
  const pagination = data?.pagination;
  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const openEditor = async (id, duplicate = false) => {
    try {
      const [exam, assigned] = await Promise.all([
        getExam(id),
        getExamQuestions(id),
      ]);
      setWizardExam(
        duplicate
          ? {
              ...exam,
              id: null,
              title: `Copy of ${exam.title}`,
              status: "draft",
              assignedQuestions: assigned.questions,
            }
          : { ...exam, assignedQuestions: assigned.questions },
      );
    } catch (error) {
      toast.error(errorMessage(error, "Unable to load exam"));
    }
  };
  return (
    <div className="mx-auto max-w-7xl pb-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-cyan-300">
            ASSESSMENT MANAGEMENT
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Exams
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Create, schedule, and manage examination experiences.
          </p>
        </div>
        <Button onClick={() => setWizardExam({})}>
          <Plus size={18} />
          Create exam
        </Button>
      </header>
      <Card className="overflow-hidden">
        <div className="space-y-4 border-b border-white/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-xl">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search exam titles"
                className="w-full rounded-xl border border-white/10 bg-white/[.03] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-400/60"
              />
            </div>
            <p className="text-sm text-zinc-500">
              {pagination ? `${pagination.total} exams` : "—"}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Filter
              value={filters.subjectId}
              onChange={(value) => changeFilter("subjectId", value)}
              label="All subjects"
            >
              {subjects?.subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Filter>
            <Filter
              value={filters.status}
              onChange={(value) => changeFilter("status", value)}
              label="All statuses"
            >
              {["draft", "published", "active", "closed"].map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </Filter>
          </div>
        </div>
        {isPending ? (
          <Loading />
        ) : isError ? (
          <Error retry={refetch} />
        ) : exams.length === 0 ? (
          <Empty
            add={() => setWizardExam({})}
            active={Boolean(
              deferredSearch || Object.values(filters).some(Boolean),
            )}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-350 text-left text-sm">
                <thead className="bg-white/[.025] text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    {[
                      "Exam",
                      "Subject",
                      "Duration",
                      "Questions",
                      "Marks",
                      "Schedule",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} className="px-5 py-3 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam, index) => (
                    <motion.tr
                      key={exam.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      className="border-t border-white/5"
                    >
                      <td className="max-w-62 px-5 py-4">
                        <p className="font-medium text-white">{exam.title}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                          {exam.description || "No description"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-zinc-300">
                        {exam.subjectName}
                      </td>
                      <td className="px-5 py-4">{exam.durationMinutes} min</td>
                      <td className="px-5 py-4">{exam.totalQuestions}</td>
                      <td className="px-5 py-4">
                        <p>{exam.totalMarks}</p>
                        <p className="text-xs text-zinc-500">
                          Pass: {exam.passingMarks}
                        </p>
                      </td>
                      <td className="min-w-48 px-5 py-4 text-xs text-zinc-400">
                        <p>{date(exam.startTime)}</p>
                        <p className="mt-1">to {date(exam.endTime)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Status status={exam.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <Action
                            label="Preview exam"
                            onClick={() => setPreviewId(exam.id)}
                          >
                            <Eye size={16} />
                          </Action>
                          <Action
                            label="Duplicate exam"
                            onClick={() => openEditor(exam.id, true)}
                          >
                            <Copy size={16} />
                          </Action>
                          <Action
                            label="Edit exam"
                            onClick={() => openEditor(exam.id)}
                          >
                            <FilePenLine size={16} />
                          </Action>
                          {exam.status === "draft" && (
                            <Action
                              label="Publish exam"
                              onClick={() =>
                                statusMutation.mutate({
                                  id: exam.id,
                                  payload: { status: "published" },
                                })
                              }
                            >
                              <PlayCircle size={16} />
                            </Action>
                          )}
                          {["draft", "published", "active"].includes(
                            exam.status,
                          ) && (
                            <Action
                              label="Close exam"
                              onClick={() =>
                                statusMutation.mutate({
                                  id: exam.id,
                                  payload: { status: "closed" },
                                })
                              }
                            >
                              <XCircle size={16} />
                            </Action>
                          )}
                          <Action
                            label="Delete exam"
                            danger
                            onClick={() => setDeleteTarget(exam)}
                          >
                            <Trash2 size={16} />
                          </Action>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination data={pagination} setPage={setPage} />
          </>
        )}
      </Card>
      <ExamWizardModal
        open={wizardExam !== undefined}
        exam={wizardExam?.title ? wizardExam : null}
        onClose={() => setWizardExam(undefined)}
        onSubmit={(payload) =>
          saveMutation.mutate({
            exam: wizardExam?.title ? wizardExam : null,
            payload,
          })
        }
        isPending={saveMutation.isPending}
      />
      <ExamPreviewModal examId={previewId} onClose={() => setPreviewId(null)} />
      <DeleteModal
        exam={deleteTarget}
        close={() => setDeleteTarget(null)}
        confirm={() => deleteMutation.mutate(deleteTarget.id)}
        pending={deleteMutation.isPending}
      />
    </div>
  );
}
function Filter({ value, onChange, label, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
    >
      <option value="">{label}</option>
      {children}
    </select>
  );
}
function Status({ status }) {
  const colors = {
    draft: "bg-white/10 text-zinc-300",
    published: "bg-cyan-400/10 text-cyan-300",
    active: "bg-emerald-500/10 text-emerald-300",
    closed: "bg-rose-500/10 text-rose-300",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colors[status] || colors.draft}`}
    >
      {status}
    </span>
  );
}
function Action({ children, label, danger, onClick }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${danger ? "text-rose-300 hover:bg-rose-500/10" : "text-zinc-400 hover:bg-white/5 hover:text-cyan-200"}`}
    >
      {children}
    </button>
  );
}
function Pagination({ data, setPage }) {
  if (!data || data.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
      <p className="text-sm text-zinc-500">
        Page {data.page} of {data.totalPages}
      </p>
      <div className="flex gap-2">
        <button
          disabled={data.page === 1}
          onClick={() => setPage(data.page - 1)}
          className="rounded-lg border border-white/10 p-2 disabled:opacity-40"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          disabled={data.page === data.totalPages}
          onClick={() => setPage(data.page + 1)}
          className="rounded-lg border border-white/10 p-2 disabled:opacity-40"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
function Loading() {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: 7 }, (_, index) => (
        <Skeleton key={index} className="h-17 w-full" />
      ))}
    </div>
  );
}
function Empty({ active, add }) {
  return (
    <div className="grid min-h-75 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <FilePenLine />
        </span>
        <h2 className="mt-4 font-bold">
          {active ? "No exams found" : "No exams yet"}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {active
            ? "Try changing your search or filters."
            : "Create the first exam to begin scheduling assessments."}
        </p>
        {!active && (
          <Button className="mt-5" onClick={add}>
            <Plus size={16} />
            Create exam
          </Button>
        )}
      </div>
    </div>
  );
}
function Error({ retry }) {
  return (
    <div className="p-8 text-center">
      <p className="font-medium text-rose-300">Unable to load exams.</p>
      <button onClick={retry} className="mt-3 text-sm text-cyan-300">
        Try again
      </button>
    </div>
  );
}
function DeleteModal({ exam, close, confirm, pending }) {
  return (
    <Modal open={Boolean(exam)} onClose={close} title="Delete exam">
      <p className="text-sm leading-6 text-zinc-400">
        Delete <span className="font-medium text-white">{exam?.title}</span>?
        All question assignments and student attempts will be removed.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <button
          onClick={confirm}
          disabled={pending}
          className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Deleting..." : "Delete exam"}
        </button>
      </div>
    </Modal>
  );
}
