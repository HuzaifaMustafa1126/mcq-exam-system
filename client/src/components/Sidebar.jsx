import {
  BarChart3,
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
  HelpCircle,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
const studentItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/exams", label: "Exams", icon: BookOpen },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: Users },
];
const teacherItems = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/questions", label: "Questions", icon: HelpCircle },
  { to: "/teacher/exams", label: "Assigned exams", icon: BookOpen },
  { to: "/teacher/results", label: "Results", icon: BarChart3 },
  { to: "/teacher/profile", label: "Profile", icon: Users },
];
const adminItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/teachers", label: "Teachers", icon: Users },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { to: "/admin/exams", label: "Exams", icon: BookOpen },
  { to: "/admin/questions", label: "Questions", icon: HelpCircle },
  { to: "/admin/results", label: "Results", icon: FileText },
];
export default function Sidebar({
  admin = false,
  teacher = false,
  mobileOpen = false,
  onClose,
}) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const items = admin ? adminItems : teacher ? teacherItems : studentItems;
  const home = admin ? "/admin" : teacher ? "/teacher" : "/dashboard";
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/60 lg:hidden ${mobileOpen ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`student-sidebar fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col p-5 transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="mb-10 flex items-center justify-between">
          <NavLink
            to={home}
            onClick={onClose}
            className="flex items-center gap-3 text-xl font-bold"
          >
            <>
              <img
                src="/logo.png"
                alt="Hussain Forces Academy crest"
                className="size-12 object-contain"
              />
              <span className="leading-tight">
                <span className="block text-base">HUSSAIN FORCES</span>
                <span className="block text-xs font-medium tracking-wider text-[#c9b86a]">
                  CRADLE OF LEADERS
                </span>
              </span>
            </>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${isActive ? "student-nav-active" : "student-nav-item"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto">
          <div className="student-user-card mb-4 rounded-xl p-3 text-xs">
            <p className="font-semibold text-white">
              {user?.name || "Exam learner"}
            </p>
            <p className="mt-1 capitalize">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
              onClose?.();
            }}
            className="student-logout flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
