import React, { Suspense } from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { routeConfig, demoRoutes, LoadingFallback } from "./shared/config/routes";
import RouteGuard from "./shared/components/RouteGuard";
import MainLayout from "./shared/layouts/MainLayout";
import OwnerLayout from "./roles/owner/layouts/OwnerLayout";
import AdminLayout from "./roles/admin/layouts/AdminLayout";
import AuthLayout from "./shared/layouts/AuthLayout";
import { getDefaultPathForRole } from "./shared/constants/roles";

/**
 * App Component - Refactored với route configuration
 * Code sạch hơn, dễ maintain và mở rộng
 */

function AppContent() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // Helper function to render route element
  const renderRouteElement = (route) => {
    const { element: Element, layout, allowedRoles, requireAuth = true, public: isPublic = false, isDemo = false } = route;
    const elementProps = isDemo ? { isDemo: true } : { user };

    // Get layout component
    let LayoutComponent = null;
    if (layout === "MainLayout") LayoutComponent = MainLayout;
    else if (layout === "OwnerLayout") LayoutComponent = OwnerLayout;
    else if (layout === "AdminLayout") LayoutComponent = AdminLayout;
    else if (layout === "AuthLayout") LayoutComponent = AuthLayout;

    // Render element with layout
    const renderElement = () => {
      if (LayoutComponent) {
        if (layout === "AuthLayout") {
          return (
            <LayoutComponent>
              <Suspense fallback={<LoadingFallback />}>
                <Element />
              </Suspense>
            </LayoutComponent>
          );
        }
        return (
          <LayoutComponent user={user} onLoggedOut={logout}>
            <Suspense fallback={<LoadingFallback />}>
              <Element {...elementProps} />
            </Suspense>
          </LayoutComponent>
        );
      }
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Element {...elementProps} />
        </Suspense>
      );
    };

    // Public routes
    if (isPublic) {
      return user ? (
        <Navigate to={getDefaultPathForRole(user)} replace />
      ) : (
        renderElement()
      );
    }

    // Protected routes with RouteGuard
    return (
      <RouteGuard allowedRoles={allowedRoles} requireAuth={requireAuth}>
        {renderElement()}
      </RouteGuard>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes - Public, redirect if logged in */}
        <Route
          path="/auth"
          element={
            user ? (
              <Navigate to={getDefaultPathForRole(user)} replace />
            ) : (
              <AuthLayout />
            )
          }
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getDefaultPathForRole(user)} replace />
            ) : (
              <AuthLayout />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to={getDefaultPathForRole(user)} replace />
            ) : (
              <AuthLayout />
            )
          }
        />

        {/* Main Routes from config */}
        {routeConfig.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={renderRouteElement(route)}
          />
        ))}

        {/* Demo Routes */}
        {demoRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <OwnerLayout user={user} onLoggedOut={logout} isDemo={true}>
                <Suspense fallback={<LoadingFallback />}>
                  <route.element isDemo={true} />
                </Suspense>
              </OwnerLayout>
            }
          />
        ))}

        {/* Dashboard redirect based on role */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Navigate to={getDefaultPathForRole(user)} replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ModalProvider>
          <AppContent />
        </ModalProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
