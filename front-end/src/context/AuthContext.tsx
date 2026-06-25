import React, { createContext, useContext, useState, useEffect } from "react";
import { apiCall } from "../utils/apiClient";

interface User {
  id: string;
  email: string;
  name: string;
  preferences?: {
    role: string;
    location: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserPreferences: (role: string, location: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("access_token");
      const storedUser = localStorage.getItem("user");

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            // ignore JSON parse error
          }
        }
        
        try {
          // Fetch fresh user data from backend
          const userData = await apiCall("/api/auth/me", {
            method: "GET",
          });
          
          // Preserve local storage preferences if any
          const localPrefs = localStorage.getItem("user_preferences");
          if (localPrefs) {
            try {
              userData.preferences = JSON.parse(localPrefs);
            } catch (e) {}
          }
          
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (error) {
          console.error("Auth initialization failed, clearing token", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const { token: accessToken, user: userData } = data;
    
    // Load existing preferences if any
    const localPrefs = localStorage.getItem("user_preferences");
    if (localPrefs) {
      try {
        userData.preferences = JSON.parse(localPrefs);
      } catch (e) {}
    }

    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    const { token: accessToken, user: userData } = data;

    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  };

  const updateUserPreferences = async (role: string, location: string) => {
    const updatedUser = user ? { ...user } : ({} as User);
    updatedUser.preferences = { role, location };
    
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem("user_preferences", JSON.stringify({ role, location }));

    // Optionally attempt PUT /api/auth/update
    try {
      await apiCall("/api/auth/update", {
        method: "PUT",
        body: JSON.stringify({ role, location })
      });
    } catch (e) {
      console.warn("Backend update preferences endpoint not found or failed, saved locally:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserPreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      token: null,
      loading: typeof window === 'undefined',
      login: async () => {},
      register: async () => {},
      logout: () => {},
      updateUserPreferences: async () => {},
    };
  }
  return context;
};

