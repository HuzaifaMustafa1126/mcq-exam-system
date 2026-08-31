import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="academy-auth grid min-h-screen place-items-center p-4 sm:p-6">
      <Outlet />
    </main>
  );
}
