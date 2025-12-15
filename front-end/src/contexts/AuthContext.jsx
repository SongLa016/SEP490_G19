import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
     const profileLoadedRef = useRef(false);

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
          profileLoadedRef.current = false; // Reset flag khi login mới
          setUser(userData);
          if (token) {
               storeToken(token);
          }

          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(userData));
     };

     const logoutUser = () => {
          profileLoadedRef.current = false; // Reset flag khi logout
          logout();
          setUser(null);
     };

     const updateUser = (userData) => {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
     };

     // Sau khi có user, tự động gọi API profile để lấy avatar/fullName (ưu tiên dữ liệu từ API để tránh lỗi encoding)
     useEffect(() => {
          const userId = user?.userID || user?.userId || user?.id;
          if (!user || !userId || profileLoadedRef.current) return;

          let isCancelled = false;
          profileLoadedRef.current = true; // Đánh dấu đã load để tránh gọi lại

          const loadProfile = async () => {
               try {
                    const result = await profileService.getProfile(userId);
                    const profile = result?.profile || result?.data || null;

                    if (!isCancelled && profile) {
                         // Ưu tiên fullName từ profile API để tránh lỗi encoding từ JWT token
                         const profileFullName = profile.fullName || profile.FullName;
                         const enrichedUser = {
                              ...user,
                              avatar: profile.avatar || profile.avatarUrl || user.avatar || null,
                              fullName: profileFullName || user.fullName,
                              name: profileFullName || user.name,
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
