import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!authService.isAuthenticated()) {
        authService.logout();
        toast.error("Session expired or unauthorized access");
        window.location.href = "/login";
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authService.isAuthenticated()) {
    console.log("hoy");
    return <Navigate to='/login' state={{ from: location }} replace />;
  }
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    console.log(user.role);
    return <Navigate to='/unknown' replace />;
  }

  return children;
};
