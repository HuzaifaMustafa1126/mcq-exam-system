import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRoute } from "../utils/auth";

export default function ProtectedRoute({ roles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user?.role)) {
    return (
      <div role="alert" className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="my-4">You do not have permission to view this page.</p>
        <Link to={getDefaultRoute(user?.role)} className="text-[#c9b86a]">
          Return to your dashboard
        </Link>
      </div>
    );
  }
  return <Outlet />;
}
