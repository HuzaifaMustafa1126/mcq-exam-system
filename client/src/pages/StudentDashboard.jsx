import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../components/Card";
import ExamCard from "../components/ExamCard";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getStudentDashboard, getStudentExams } from "../services/student";
const statDefs = [
  ["Available Exams", "availableExams", BookOpen],
  ["Completed Exams", "completedExams", CheckCircle2],
  ["Upcoming Exams", "upcomingExams", Trophy],
  ["Average Score", "averageScore", Award],
];
export default function StudentDashboard() {
  const { user } = useAuth();
  const dashboard = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
  });
  const exams = useQuery({
    queryKey: ["student-exams"],
    queryFn: getStudentExams,
  });
  const data = dashboard.data;
  return (
    <div className="mx-auto max-w-7xl">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-sm font-medium tracking-widest text-[#c9b86a]">
            CADET DASHBOARD
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-2 text-[#a8b2aa]">
            Your examination performance at a glance.
          </p>
        </div>
        <Link
          to="/exams"
          className="text-sm font-semibold text-[#f2e7a1] hover:text-white"
        >
          Browse all exams <ArrowRight className="inline" size={16} />
        </Link>
      </motion.header>
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statDefs.map(([label, key, Icon], i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            key={key}
          >
            <Card className="p-6">
              <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-[#1f5a3a]/40 text-[#f2e7a1]">
                <Icon size={20} />
              </div>
              <p className="text-3xl font-bold">
                {dashboard.isLoading
                  ? "—"
                  : key === "averageScore"
                    ? `${data?.[key] ?? 0}%`
                    : (data?.[key] ?? 0)}
              </p>
              <p className="mt-1 text-sm text-[#a8b2aa]">{label}</p>
            </Card>
          </motion.div>
        ))}
      </section>
      <section className="mt-9">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Available examinations</h2>
          <span className="text-sm text-[#a8b2aa]">
            {exams.data?.length ?? 0} available
          </span>
        </div>
        {exams.isLoading ? (
          <p className="text-[#a8b2aa]">Loading your exams…</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {exams.data?.slice(0, 3).map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
