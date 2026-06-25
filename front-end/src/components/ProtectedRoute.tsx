import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !token) {
      navigate({ to: "/login" });
    }
  }, [token, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-darkbg text-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-terracotta border-t-transparent"></div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
};
export default ProtectedRoute;
