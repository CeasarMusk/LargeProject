// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from "react";
import { loginUser } from "../api/authApi";

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  login: (loginValue: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from local storage on initial load
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {}
    }
  }, []);

  // Login function
  const login = async (loginValue: string, password: string) => {
    const result = await loginUser({ login: loginValue, password });

    const newUser: User = {
      id: result.id,
      firstName: result.firstName,
      lastName: result.lastName
    };

    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
export function getStoredUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

