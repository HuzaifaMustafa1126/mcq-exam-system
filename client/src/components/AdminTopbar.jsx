import { Bell, ChevronDown, LogOut, Menu, Moon, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminTopbar({ onMenu }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/75 px-5 py-4 backdrop-blur-xl md:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-xl p-2 text-zinc-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>
        <div className="relative hidden max-w-md flex-1 sm:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={18}
          />
          <input
            aria-label="Search"
            placeholder="Search students, exams, or questions..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
          />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            className="rounded-xl p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-cyan-200"
            aria-label="Dark mode enabled"
          >
            <Moon size={19} />
          </button>
          <button
            className="relative rounded-xl p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-cyan-200"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-cyan-400" />
          </button>
          <div className="relative ml-1">
            <button
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-white/5"
              aria-expanded={profileOpen}
            >
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-bold">
                {user?.name?.slice(0, 1).toUpperCase() || "A"}
              </span>
              <span className="hidden max-w-28 truncate text-sm font-medium text-white md:block">
                {user?.name || "Administrator"}
              </span>
              <ChevronDown
                size={15}
                className="hidden text-zinc-500 md:block"
              />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl">
                <p className="px-3 py-2 text-xs text-zinc-500">{user?.email}</p>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
