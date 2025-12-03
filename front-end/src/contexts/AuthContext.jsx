import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
     clearPersistedAuth,
     getStoredToken,
     isTokenExpired,
     storeToken
} from '../shared/utils/tokenManager';
import {
     isPlayer,
     isOwner,
     isAdmin,
     hasRole,
     hasAnyRole,
     getDefaultPathForRole,
     getRoleByName,
} from '../shared/constants/roles';
import { profileService } from '../shared/services/profileService';

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

     // Sau khi có user nhưng chưa có avatar, tự động gọi API profile để lấy avatar/fullName
     useEffect(() => {
          if (!user || user.avatar) return;

          let isCancelled = false;

          const loadProfile = async () => {
               try {
                    const userId = user.userID || user.userId || user.id;
                    const result = await profileService.getProfile(userId);
                    const profile = result?.profile || result?.data || null;

                    if (!isCancelled && profile) {
                         const enrichedUser = {
                              ...user,
                              avatar: profile.avatar || profile.avatarUrl || user.avatar || null,
                              fullName: user.fullName || profile.fullName || profile.FullName || user.fullName,
                              name: user.name || profile.fullName || profile.FullName || user.name,
                         };
                         setUser(enrichedUser);
                         localStorage.setItem('user', JSON.stringify(enrichedUser));
                    }
               } catch (e) {
                    // Im lặng nếu lỗi, vẫn dùng fallback avatar chữ cái
                    console.warn('[AuthContext] Failed to load profile for avatar:', e);
               }
          };

          loadProfile();

          return () => {
               isCancelled = true;
          };
     }, [user]);

     // Memoized role helpers for better performance
     const roleHelpers = useMemo(() => ({
          isPlayer: () => isPlayer(user),
          isOwner: () => isOwner(user),
          isAdmin: () => isAdmin(user),
          hasRole: (roleName) => hasRole(user, roleName),
          hasAnyRole: (roleNames) => hasAnyRole(user, roleNames),
          getDefaultPath: () => getDefaultPathForRole(user),
          getRole: () => user ? getRoleByName(user.roleName) : null,
     }), [user]);

     const value = {
          user,
          login,
          logout: logoutUser,
          updateUser,
          isLoading,
          ...roleHelpers, // Spread role helpers for convenience
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
