import { createContext, useState, useEffect } from "react";
import { getCurrentAdmin } from "../api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state by checking for a token in localStorage
  const [authData, setAuthData] = useState(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // In a real application, you would decode the token or call an API 
      // to get user details. For this setup, we just confirm the token exists.
      return { token: token, user: { username: "Admin" } }; 
    }
    return null;
  });

  // Load current admin data when component mounts
  useEffect(() => {
    const loadCurrentAdmin = async () => {
      const token = localStorage.getItem("token");
      if (token && authData?.user?.username === "Admin") {
        try {
          const response = await getCurrentAdmin();
          if (response.data?.success) {
            setAuthData(prev => ({
              ...prev,
              user: response.data.data.admin
            }));
          }
        } catch (error) {
          console.error("Failed to load current admin:", error);
        }
      }
    };

    loadCurrentAdmin();
  }, []);

  // Function to handle logout
  const logout = () => {
    setAuthData(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ authData, setAuthData, logout }}>
      {children}
    </AuthContext.Provider>
  );
};