import { authService } from "@/services/authService";
import { Navigate } from "react-router-dom";

export const PublicRoute = ({ children }) => {
  if (authService.isAuthenticated()) {
    return <Navigate to='/' replace />;
  }

  return children;
};
