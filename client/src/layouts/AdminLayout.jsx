import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminTopbar from "../components/AdminTopbar";
import Sidebar from "../components/Sidebar";
export default function AdminLayout() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  return (
    <div className="academy-portal min-h-screen">
      <Sidebar
        admin
        fixed
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
