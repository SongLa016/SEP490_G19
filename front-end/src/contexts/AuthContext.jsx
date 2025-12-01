import React, { createContext, useContext, useState, useEffect } from 'react';
import {
     clearPersistedAuth,
     getStoredToken,
     isTokenExpired,
     storeToken
} from '../shared/utils/tokenManager';

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
          const token = getStoredToken();

          if (token && isTokenExpired(token)) {
               clearPersistedAuth();
               setUser(null);
          } else {
               setUser(currentUser);
          }
          setIsLoading(false);
     }, []);

     const login = (userData, token = null) => {
          setUser(userData);
          if (token) {
               storeToken(token);
          }

          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(userData));
     };

     const logoutUser = () => {
          logout();
          setUser(null);
     };

     const updateUser = (userData) => {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
     };

     const value = {
          user,
          login,
          logout: logoutUser,
          updateUser,
          isLoading
     };

     return (
          <AuthContext.Provider value={value}>
               {children}
          </AuthContext.Provider>
     );
};

// Helper functions for localStorage management
function getCurrentUser() {
     try {
          const userData = localStorage.getItem('user');
          return userData ? JSON.parse(userData) : null;
     } catch (e) {
          return null;
     }
}

function logout() {
     clearPersistedAuth();
}
