import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_ME } from "./auth";
import AuthPage from "./pages/AuthPage";
import TasksPage from "./pages/TasksPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const { data, loading, error } = useQuery(GET_ME);
  const user = data?.me;

  if (loading) return <div className="page center-screen">Checking session...</div>;
  if (error) return <div className="page center-screen error">{error.message}</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/tasks" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={user ? <Navigate to="/tasks" replace /> : <AuthPage mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/tasks" replace /> : <AuthPage mode="register" />} />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute user={user}>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
