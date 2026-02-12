import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { userId, userName, email, role }
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const userInfo = authService.getUserInfo();
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    await authService.login(credentials);
    const userInfo = authService.getUserInfo();
    setUser(userInfo);

    console.log(userInfo);
    // ⏩ Auto-redirect based on role
    if (userInfo?.role === "Therapist") navigate("/therapist");
    else if (userInfo?.role === "Customer") navigate("/");
    else navigate("/");
  };

  const logout = () => {
    authService.removeToken();
    setUser(null);
    navigate("/login");
  };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
