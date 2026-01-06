import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null; // bisa ganti spinner
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}
