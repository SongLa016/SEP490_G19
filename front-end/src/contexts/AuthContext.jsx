import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout } from '../utils/authStore';

const AuthContext = createContext();

export const useAuth = () => {
     const context = useContext(AuthContext);
     if (!context) {
          throw new Error('useAuth must be used within an AuthProvider');
     }
     return context;
};

export const AuthProvider = ({ children }) => {
     const [user, setUser] = useState(null);
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
          // Get current user from localStorage on app start
          const currentUser = getCurrentUser();
          setUser(currentUser);
          setIsLoading(false);
     }, []);

     const login = (userData) => {
          setUser(userData);
     };

     const logoutUser = () => {
          logout();
          setUser(null);
     };

     const value = {
          user,
          login,
          logout: logoutUser,
          isLoading
     };

     return (
          <AuthContext.Provider value={value}>
               {children}
          </AuthContext.Provider>
     );
};
