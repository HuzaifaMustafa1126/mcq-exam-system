import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminTopbar from "../components/AdminTopbar";
import Sidebar from "../components/Sidebar";
export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="academy-portal student-portal min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="academy-main min-w-0">
        <AdminTopbar onMenu={() => setMobileOpen(true)} />
        <main className="student-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
