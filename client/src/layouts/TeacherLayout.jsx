import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminTopbar from "../components/AdminTopbar";
import Sidebar from "../components/Sidebar";

export default function TeacherLayout() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  return (
    <div className="academy-portal min-h-screen">
      <Sidebar
        teacher
        mobileOpen={navigationOpen}
        onClose={() => setNavigationOpen(false)}
      />
      <div className="academy-main min-w-0">
        <AdminTopbar onMenu={() => setNavigationOpen(true)} />
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
