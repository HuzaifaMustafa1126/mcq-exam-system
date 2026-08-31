import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getStudentResults } from "../services/student";
import Card from "../components/Card";

export default function StudentResultsPage() {
  const query = useQuery({
    queryKey: ["student-results"],
    queryFn: getStudentResults,
  });
  const results = query.data?.results || [];
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold tracking-widest text-[#c9b86a]">
        CADET RECORD
      </p>
      <h1 className="mt-1 text-3xl font-bold">Examination history</h1>
      <Card className="mt-7 overflow-x-auto p-0">
        {query.isLoading ? (
          <p className="p-6 text-[#a8b2aa]">Loading results…</p>
        ) : results.length ? (
          <table className="min-w-[680px] w-full text-left text-sm">
            <thead className="border-b border-[#f2e7a1]/14 text-[#a8b2aa]">
              <tr>
                <th className="p-4">Exam</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Score</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-[#f2e7a1]/8">
                  <td className="p-4 font-medium">{r.examName}</td>
                  <td className="p-4 text-[#a8b2aa]">{r.subjectName}</td>
                  <td className="p-4">
                    {r.obtainedMarks}/{r.totalMarks} ({r.percentage}%)
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${r.status === "PASS" ? "bg-[#4caf70]/15 text-[#a9e4ba]" : "bg-[#c94a4a]/15 text-[#ffb1b1]"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      className="text-[#f2e7a1]"
                      to={`/result/${r.attemptId}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-10 text-center text-[#a8b2aa]">
            You have not completed any exams yet.
          </p>
        )}
      </Card>
    </div>
  );
}
