import React, { Suspense } from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import {
  routeConfig,
  demoRoutes,
  LoadingFallback,
} from "./shared/config/routes";
import RouteGuard from "./shared/components/RouteGuard";
import MainLayout from "./shared/layouts/MainLayout";
import OwnerLayout from "./roles/owner/layouts/OwnerLayout";
import AdminLayout from "./roles/admin/layouts/AdminLayout";
import AuthLayout from "./shared/layouts/AuthLayout";
import { getDefaultPathForRole } from "./shared/constants/roles";

// tạo một instance QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // hàm render route element
  const renderRouteElement = (route) => {
    const {
      element: Element,
      layout,
      allowedRoles,
      requireAuth = true,
      public: isPublic = false,
      isDemo = false,
    } = route;
    const elementProps = isDemo ? { isDemo: true } : { user };

    // lấy component layout
    let LayoutComponent = null;
    if (layout === "MainLayout") LayoutComponent = MainLayout;
    else if (layout === "OwnerLayout") LayoutComponent = OwnerLayout;
    else if (layout === "AdminLayout") LayoutComponent = AdminLayout;
    else if (layout === "AuthLayout") LayoutComponent = AuthLayout;

    // render element với layout
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

    // routes public
    if (isPublic) {
      return user ? (
        <Navigate to={getDefaultPathForRole(user)} replace />
      ) : (
        renderElement()
      );
    }

    // Routes bảo vệ với RouteGuard
    return (
      <RouteGuard allowedRoles={allowedRoles} requireAuth={requireAuth}>
        {renderElement()}
      </RouteGuard>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* routes auth */}
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

        {/* routes chính từ config */}
        {routeConfig.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={renderRouteElement(route)}
          />
        ))}

        {/* routes demo */}
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

        {/* redirect dashboard dựa trên vai trò */}
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

        {/* route catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <LanguageProvider>
          <AuthProvider>
            <ModalProvider>
              <AppContent />
            </ModalProvider>
          </AuthProvider>
        </LanguageProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
