import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, ClipboardList, Users } from "lucide-react";
import Card from "../components/Card";
import { useAuth } from "../hooks/useAuth";
import { getExams } from "../services/exams";
import { getQuestions } from "../services/questions";
import { getResults } from "../services/results";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const questions = useQuery({
    queryKey: ["teacher-questions"],
    queryFn: () => getQuestions({ page: 1, limit: 100 }),
  });
  const exams = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: () => getExams({ page: 1, limit: 100 }),
  });
  const results = useQuery({
    queryKey: ["teacher-results"],
    queryFn: () => getResults({ page: 1, limit: 100 }),
  });
  const list = results.data?.results || [];
  const average = list.length
    ? (
        list.reduce((total, result) => total + result.percentage, 0) /
        list.length
      ).toFixed(1)
    : 0;
  const chart =
    exams.data?.exams?.map((exam) => ({
      name: exam.title,
      questions: exam.totalQuestions,
    })) || [];
  const summary = [
    ["Total Questions", questions.data?.pagination?.total || 0, BookOpen],
    ["Total Exams", exams.data?.pagination?.total || 0, ClipboardList],
    ["Students Appeared", results.data?.summary?.total || 0, Users],
    ["Average Score", `${average}%`, Bar],
  ];
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold tracking-widest text-[#c9b86a]">
        INSTRUCTOR PORTAL
      </p>
      <h1 className="mt-1 text-3xl font-bold">Welcome, {user?.name}</h1>
      <p className="mt-2 text-[#a8b2aa]">
        Manage academy examinations, questions, and cadet performance.
      </p>
      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(([label, value, Icon], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-[#1f5a3a]/35">
                <Icon className="text-[#f2e7a1]" size={22} />
              </span>
              <p className="mt-5 text-3xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-[#a8b2aa]">{label}</p>
            </Card>
          </motion.div>
        ))}
      </section>
      <section className="mt-7 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold">Question statistics</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chart}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="questions" fill="#c9b86a" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold">Exam performance</h2>
          <p className="mt-3 text-4xl font-bold text-[#a9e4ba]">{average}%</p>
          <p className="mt-2 text-sm text-[#a8b2aa]">
            Average score across submitted attempts.
          </p>
        </Card>
      </section>
    </div>
  );
}
