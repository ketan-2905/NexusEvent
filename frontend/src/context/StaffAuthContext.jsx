
import { createContext, useContext, useState, useEffect } from "react";
import staffApi from "../utils/staffApi";

const StaffAuthContext = createContext();

export const StaffAuthProvider = ({ children }) => {
    const [staffUser, setStaffUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStaffAuth();
    }, []);

    const checkStaffAuth = async () => {
        const token = localStorage.getItem("staffToken");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await staffApi.get("/staff/me");
            setStaffUser(res.data);
        } catch (error) {
            console.error("Staff auth check failed", error);
            localStorage.removeItem("staffToken");
            localStorage.removeItem("staffUser");
            setStaffUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await staffApi.post("/staff/login", { email, password });
        const { token, user } = res.data;

        localStorage.setItem("staffToken", token);
        localStorage.setItem("staffUser", JSON.stringify(user));
        setStaffUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem("staffToken");
        localStorage.removeItem("staffUser");
        setStaffUser(null);
    };

    return (
        <StaffAuthContext.Provider value={{ staffUser, loading, login, logout }}>
            {children}
        </StaffAuthContext.Provider>
    );
};

export const useStaffAuth = () => useContext(StaffAuthContext);
