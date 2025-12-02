import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getDefaultPathForRole, hasAnyRole } from "../constants/roles";

/**
 * RouteGuard - Component bảo vệ routes theo role
 * Sử dụng để thay thế các điều kiện role check lặp lại trong App.js
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Component cần render
 * @param {string|string[]} props.allowedRoles - Role(s) được phép truy cập
 * @param {boolean} props.requireAuth - Yêu cầu đăng nhập (default: true)
 * @param {string} props.redirectTo - Path redirect nếu không có quyền (optional)
 */
export const RouteGuard = ({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = null,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    const redirectPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/auth" replace state={{ from: redirectPath }} />;
  }

  // Check role permissions
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasPermission = hasAnyRole(user, roles);

    if (!hasPermission) {
      // Redirect to appropriate dashboard based on user role or custom redirect
      const defaultPath = redirectTo || getDefaultPathForRole(user) || "/dashboard";
      return <Navigate to={defaultPath} replace />;
    }
  }

  return <>{children}</>;
};

export default RouteGuard;

