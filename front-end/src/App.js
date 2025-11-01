import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider } from "./contexts/ModalContext";

// Layouts
import MainLayout from "./shared/layouts/MainLayout";
import AuthLayout from "./shared/layouts/AuthLayout";
import AdminLayout from "./roles/admin/layouts/AdminLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Dashboard from "./roles/player/pages/dashboard/Dashboard";
import OwnerDashboard from "./roles/owner/pages/owner/OwnerDashboard";
import {
  FieldManagement,
  PricingManagement,
  BookingManagement,
  RevenueReports,
  ScheduleManagement,
  CancellationPolicies,
  DepositPolicies,
  PromotionsManagement,
  PaymentTracking,
  NotificationsManagement,
} from "./roles/owner/pages/owner";
import TimeSlotManagement from "./roles/owner/pages/owner/TimeSlotManagement";
import FieldSearch from "./roles/player/pages/fields/FieldSearch";

import BookingHistory from "./roles/player/pages/booking/BookingHistory";
import ComplexDetail from "./roles/player/pages/fields/ComplexDetail";
import Community from "./roles/player/pages/community/Community";

// Profile Pages
import ProfileIndex from "./roles/player/pages/profile";
import ProfileDemo from "./roles/player/pages/profile/ProfileDemo";

// Admin Pages
import {
  AdminDashboard,
  UserManagement,
  SystemNotificationsManagement,
  ViolationReportsManagement,
  BlogManagement,
  SystemSettings,
} from "./roles/admin/pages";
import OwnerRegistrationApproval from "./roles/admin/pages/OwnerRegistrationApproval";

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
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

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
              <HomePage user={user} />
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
                <Dashboard user={user} />
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
              <ComplexDetail user={user} />
            </MainLayout>
          }
        />
        <Route
          path="/field/:id"
          element={
            <MainLayout>
              <ComplexDetail user={user} />
            </MainLayout>
          }
        />
        <Route
          path="/bookings"
          element={
            <MainLayout>
              <BookingHistory user={user} />
            </MainLayout>
          }
        />
        <Route path="/community" element={<Community />} />

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
    </Router>
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
