import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
 
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("drivefleet_session");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setIsInitializing(false);
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    
    await new Promise((r) => setTimeout(r, 1000));
    
    const name = email.split("@")[0];
    const userData = { email, role, name, id: Date.now() };

    
    setUser(userData);
    localStorage.setItem("drivefleet_session", JSON.stringify(userData));
    
    setLoading(false);
    return true;
  };

  const logout = () => {
   
    setUser(null);
    localStorage.removeItem("drivefleet_session");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);