import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            try {
                // Ensure axios sends the token in header (interceptor already handles it if token is in localStorage)
                // But wait, the interceptor reads from localStorage.getItem("token"), so it should be fine.
                // However, setToken state might not be updated yet in api.js? 
                // Actually api.js reads directly from localStorage every request.
                
                const res = await api.get("/auth/me");
                setUser(res.data);
                setToken(storedToken);
            } catch (error) {
                console.error("Session restoration failed:", error);
                localStorage.removeItem("token");
                setToken(null);
                setUser(null);
            }
        }
        setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      navigate("/dashboard");
      return { success: true };
    } catch (error) {
      if (error.response?.data?.errorCode === "EMAIL_NOT_VERIFIED") {
         navigate("/verify-email", { state: { email: error.response.data.email } });
         return { success: false, error: "Email not verified" };
      }
      throw error;
    }
  };

  const signup = async (data) => {
    const res = await api.post("/auth/signup", data);
    return res.data;
  };

  const verifyEmail = async (email, code) => {
    const res = await api.post("/auth/verify-email", { email, code });
    // After verification, we get a token
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
    navigate("/dashboard");
  };

  const resendCode = async (email) => {
    await api.post("/auth/resend-code", { email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, verifyEmail, resendCode, logout, loading }}>
        {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
