import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";

// Layouts - Keep these synchronous as they're always needed
import MainLayout from "./shared/layouts/MainLayout";
import AuthLayout from "./shared/layouts/AuthLayout";
import AdminLayout from "./roles/admin/layouts/AdminLayout";

// FieldSearch - Import directly (frequently used, don't lazy load for better navigation speed)
import FieldSearch from "./roles/player/pages/fields/FieldSearch";

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
  </div>
);

// Lazy load pages for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const Dashboard = lazy(() =>
  import("./roles/player/pages/dashboard/Dashboard")
);

// Lazy load owner pages
const OwnerDashboard = lazy(() =>
  import("./roles/owner/pages/OwnerDashboard").then((m) => ({
    default: m.OwnerDashboard,
  }))
);
const FieldManagement = lazy(() =>
  import("./roles/owner/pages/FieldManagement").then((m) => ({
    default: m.FieldManagement,
  }))
);
const PricingManagement = lazy(() =>
  import("./roles/owner/pages/PricingManagement").then((m) => ({
    default: m.PricingManagement,
  }))
);
const BookingManagement = lazy(() =>
  import("./roles/owner/pages/BookingManagement").then((m) => ({
    default: m.BookingManagement,
  }))
);
const RevenueReports = lazy(() =>
  import("./roles/owner/pages/RevenueReports").then((m) => ({
    default: m.RevenueReports,
  }))
);
const ScheduleManagement = lazy(() =>
  import("./roles/owner/pages/ScheduleManagement").then((m) => ({
    default: m.ScheduleManagement,
  }))
);
const CancellationPolicies = lazy(() =>
  import("./roles/owner/pages/CancellationPolicies").then((m) => ({
    default: m.CancellationPolicies,
  }))
);
const DepositPolicies = lazy(() =>
  import("./roles/owner/pages/DepositPolicies").then((m) => ({
    default: m.DepositPolicies,
  }))
);
const PromotionsManagement = lazy(() =>
  import("./roles/owner/pages/PromotionsManagement").then((m) => ({
    default: m.PromotionsManagement,
  }))
);
const PaymentTracking = lazy(() =>
  import("./roles/owner/pages/PaymentTracking").then((m) => ({
    default: m.PaymentTracking,
  }))
);
const NotificationsManagement = lazy(() =>
  import("./roles/owner/pages/NotificationsManagement").then((m) => ({
    default: m.NotificationsManagement,
  }))
);
const TimeSlotManagement = lazy(() =>
  import("./roles/owner/pages/TimeSlotManagement").then((m) => ({
    default: m.TimeSlotManagement,
  }))
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
const ProfileDemo = lazy(() =>
  import("./roles/player/pages/profile/ProfileDemo")
);

// Admin Pages
const AdminDashboard = lazy(() =>
  import("./roles/admin/pages/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  }))
);
const UserManagement = lazy(() =>
  import("./roles/admin/pages/UserManagement").then((m) => ({
    default: m.UserManagement,
  }))
);
const SystemNotificationsManagement = lazy(() =>
  import("./roles/admin/pages/SystemNotificationsManagement").then((m) => ({
    default: m.SystemNotificationsManagement,
  }))
);
const ViolationReportsManagement = lazy(() =>
  import("./roles/admin/pages/ViolationReportsManagement").then((m) => ({
    default: m.ViolationReportsManagement,
  }))
);
const BlogManagement = lazy(() =>
  import("./roles/admin/pages/BlogManagement").then((m) => ({
    default: m.BlogManagement,
  }))
);
const SystemSettings = lazy(() =>
  import("./roles/admin/pages/SystemSettings").then((m) => ({
    default: m.SystemSettings,
  }))
);
const OwnerRegistrationApproval = lazy(() =>
  import("./roles/admin/pages/OwnerRegistrationApproval")
);

// Demo Pages

function AppContent() {
  const { user, isLoading } = useAuth();

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
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route path="/demo" element={<OwnerDashboard isDemo={true} />} />

        <Route
          path="/demo/fields"
          element={<FieldManagement isDemo={true} />}
        />
        <Route
          path="/demo/timeslots"
          element={<TimeSlotManagement isDemo={true} />}
        />
        <Route
          path="/demo/pricing"
          element={<PricingManagement isDemo={true} />}
        />
        <Route
          path="/demo/bookings"
          element={<BookingManagement isDemo={true} />}
        />
        <Route
          path="/demo/reports"
          element={<RevenueReports isDemo={true} />}
        />
        <Route
          path="/demo/schedule"
          element={<ScheduleManagement isDemo={true} />}
        />
        <Route
          path="/demo/policies"
          element={<CancellationPolicies isDemo={true} />}
        />
        <Route
          path="/demo/deposit-policies"
          element={<DepositPolicies isDemo={true} />}
        />
        <Route
          path="/demo/promotions"
          element={<PromotionsManagement isDemo={true} />}
        />
        <Route
          path="/demo/payments"
          element={<PaymentTracking isDemo={true} />}
        />
        <Route
          path="/demo/notifications"
          element={<NotificationsManagement isDemo={true} />}
        />
        <Route
          path="/owner"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <OwnerDashboard />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/fields"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <FieldManagement />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/timeslots"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <TimeSlotManagement />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/pricing"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <PricingManagement />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/bookings"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <BookingManagement />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/reports"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <RevenueReports />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/policies"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <CancellationPolicies />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/deposit-policies"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <DepositPolicies />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/promotions"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <PromotionsManagement />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/owner/notifications"
          element={
            user ? (
              user.roleName === "Owner" ? (
                <NotificationsManagement />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
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
                <AdminLayout user={user}>
                  <AdminDashboard />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user}>
                  <UserManagement />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/admin/notifications"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user}>
                  <SystemNotificationsManagement />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/admin/violations"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user}>
                  <ViolationReportsManagement />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/admin/blog"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user}>
                  <BlogManagement />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/admin/system-settings"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user}>
                  <SystemSettings />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/admin/owner-registration"
          element={
            user ? (
              user.roleName === "Admin" ? (
                <AdminLayout user={user}>
                  <OwnerRegistrationApproval />
                </AdminLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
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
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/profile/demo"
          element={
            <MainLayout>
              <ProfileDemo />
            </MainLayout>
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
