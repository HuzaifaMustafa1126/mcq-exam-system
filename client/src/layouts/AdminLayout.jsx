import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminTopbar from "../components/AdminTopbar";
import Sidebar from "../components/Sidebar";
export default function AdminLayout() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  return (
    <div className="aurora min-h-screen">
      <Sidebar
        admin
        fixed
        mobileOpen={navigationOpen}
        onClose={() => setNavigationOpen(false)}
      />
      <div className="min-w-0 lg:ml-64">
        <AdminTopbar onMenu={() => setNavigationOpen(true)} />
        <main className="min-w-0 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
