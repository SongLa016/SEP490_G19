import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";
import MainLayout from "./shared/layouts/MainLayout";
import AuthLayout from "./shared/layouts/AuthLayout";
import AdminLayout from "./roles/admin/layouts/AdminLayout";
import FieldSearch from "./roles/player/pages/fields/FieldSearch";
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
  </div>
);

const RedirectToAuth = () => {
  const location = useLocation();
  const redirectPath = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to="/auth" replace state={{ from: redirectPath }} />;
};

// Lazy load pages for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const HomePage = lazy(() => import("./roles/player/pages/home/HomePage"));
const Dashboard = lazy(() =>
  import("./roles/player/pages/dashboard/Dashboard")
);

// Lazy load owner pages
const OwnerDashboard = lazy(() => import("./roles/owner/pages/OwnerDashboard"));
const FieldManagement = lazy(() =>
  import("./roles/owner/pages/FieldManagement")
);
const PricingManagement = lazy(() =>
  import("./roles/owner/pages/PricingManagement")
);
const BookingManagement = lazy(() =>
  import("./roles/owner/pages/BookingManagement")
);
const RevenueReports = lazy(() => import("./roles/owner/pages/RevenueReports"));
const ScheduleManagement = lazy(() =>
  import("./roles/owner/pages/ScheduleManagement")
);
const CancellationPolicies = lazy(() =>
  import("./roles/owner/pages/CancellationPolicies")
);
const DepositPolicies = lazy(() =>
  import("./roles/owner/pages/DepositPolicies")
);
const PromotionsManagement = lazy(() =>
  import("./roles/owner/pages/PromotionsManagement")
);
const PaymentTracking = lazy(() =>
  import("./roles/owner/pages/PaymentTracking")
);
const NotificationsManagement = lazy(() =>
  import("./roles/owner/pages/NotificationsManagement")
);
const TimeSlotManagement = lazy(() =>
  import("./roles/owner/pages/TimeSlotManagement")
);
const FieldTypeManagement = lazy(() =>
  import("./roles/owner/pages/FieldTypeManagement")
);
const BankAccountManagement = lazy(() =>
  import("./roles/owner/pages/BankAccountManagement")
);

// Lazy load other player pages
const BookingHistory = lazy(() =>
  import("./roles/player/pages/booking/BookingHistory")
);
const ComplexDetail = lazy(() =>
  import("./roles/player/pages/fields/ComplexDetail")
);
const Community = lazy(() =>
  import("./roles/player/pages/community/Community")
);

// Profile Pages
const ProfileIndex = lazy(() => import("./roles/player/pages/profile"));

// Admin Pages
const AdminDashboard = lazy(() =>
  import("./roles/admin/pages/AdminDashboard")
);
const UserManagement = lazy(() =>
  import("./roles/admin/pages/UserManagement")
);
const SystemNotificationsManagement = lazy(() =>
  import("./roles/admin/pages/SystemNotificationsManagement")
);
const ViolationReportsManagement = lazy(() =>
  import("./roles/admin/pages/ViolationReportsManagement")
);
const PostManagement = lazy(() =>
  import("./roles/admin/pages/PostManagement")
);
const SystemSettings = lazy(() =>
  import("./roles/admin/pages/SystemSettings")
);
const OwnerRegistrationApproval = lazy(() =>
  import("./roles/admin/pages/OwnerRegistrationApproval")
);

// Demo Pages

function AppContent() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LandingPage />
            </Suspense>
          }
        />

        {/* Auth Routes */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthLayout />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthLayout />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthLayout />}
        />

        {/* Main App Routes */}
        <Route
          path="/home"
          element={
            <MainLayout>
              <Suspense fallback={<LoadingFallback />}>
                <HomePage user={user} />
              </Suspense>
            </MainLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <Navigate to="/admin" replace />
              ) : user.roleName === "Owner" ? (
                <Navigate to="/owner" replace />
              ) : (
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard user={user} />
                </Suspense>
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/demo"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <OwnerDashboard isDemo={true} />
            </Suspense>
          }
        />

        <Route
          path="/demo/fields"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FieldManagement isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/timeslots"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <TimeSlotManagement isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/pricing"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PricingManagement isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/bookings"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BookingManagement isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/reports"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <RevenueReports isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/schedule"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ScheduleManagement isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/policies"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CancellationPolicies isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/deposit-policies"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DepositPolicies isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/promotions"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PromotionsManagement isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/payments"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PaymentTracking isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/notifications"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <NotificationsManagement isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/demo/bank-accounts"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BankAccountManagement isDemo={true} />
            </Suspense>
          }
        />
        <Route
          path="/owner"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <OwnerDashboard />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/fields"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <FieldManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/field-types"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <FieldTypeManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/timeslots"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <TimeSlotManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/schedule"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <ScheduleManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/pricing"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <PricingManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/bookings"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <BookingManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/reports"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <RevenueReports />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/policies"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <CancellationPolicies />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/deposit-policies"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <DepositPolicies />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/promotions"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <PromotionsManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/notifications"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <NotificationsManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/owner/bank-accounts"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <Suspense fallback={<LoadingFallback />}>
                  <BankAccountManagement />
                </Suspense>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/search"
          element={
            <MainLayout>
              <FieldSearch user={user} />
            </MainLayout>
          }
        />
        <Route
          path="/complex/:id"
          exact
          element={
            <MainLayout>
              <Suspense fallback={<LoadingFallback />}>
                <ComplexDetail user={user} />
              </Suspense>
            </MainLayout>
          }
        />
        <Route
          path="/field/:id"
          element={
            <MainLayout>
              <Suspense fallback={<LoadingFallback />}>
                <ComplexDetail user={user} />
              </Suspense>
            </MainLayout>
          }
        />
        <Route
          path="/bookings"
          element={
            <MainLayout>
              <Suspense fallback={<LoadingFallback />}>
                <BookingHistory user={user} />
              </Suspense>
            </MainLayout>
          }
        />
        <Route
          path="/community"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Community />
            </Suspense>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user} onLoggedOut={logout}>
                  <AdminDashboard />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user} onLoggedOut={logout}>
                  <UserManagement />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/admin/notifications"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user} onLoggedOut={logout}>
                  <SystemNotificationsManagement />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/admin/violations"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user} onLoggedOut={logout}>
                  <ViolationReportsManagement />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/admin/posts"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user} onLoggedOut={logout}>
                  <PostManagement />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/admin/system-settings"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user} onLoggedOut={logout}>
                  <SystemSettings />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />
        <Route
          path="/admin/owner-registration"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user} onLoggedOut={logout}>
                  <OwnerRegistrationApproval />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <RedirectToAuth />
            )
          }
        />

        {/* Profile Routes */}
        <Route
          path="/profile"
          element={
            user ? (
              <MainLayout>
                <ProfileIndex user={user} />
              </MainLayout>
            ) : (
              <RedirectToAuth />
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
    <AuthProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
