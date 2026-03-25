import { Navigate } from "react-router";
import { useAuth } from "../contexts/useAuth";
import { LoadingSpinner } from "../../ui/LoadingSpinner";

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullscreen={true} label="Loading session..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
