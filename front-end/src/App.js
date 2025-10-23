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
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/admin/AdminLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/dashboard/Dashboard";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import {
  FieldManagement,
  PricingManagement,
  BookingManagement,
  RevenueReports,
  ScheduleManagement,
  CancellationPolicies,
  PromotionsManagement,
  PaymentTracking,
  NotificationsManagement,
} from "./pages/owner";
import TimeSlotManagement from "./pages/owner/TimeSlotManagement";
import FieldSearch from "./pages/fields/FieldSearch";

import BookingHistory from "./pages/booking/BookingHistory";
import ComplexDetail from "./pages/fields/ComplexDetail";
import Community from "./pages/community/Community";

// Profile Pages
import ProfileIndex from "./pages/profile";
import ProfileDemo from "./pages/profile/ProfileDemo";

// Admin Pages
import {
  AdminDashboard,
  UserManagement,
  SystemNotificationsManagement,
  ViolationReportsManagement,
  BlogManagement,
  SystemSettings,
} from "./pages/admin";
import OwnerRegistrationApproval from "./pages/admin/OwnerRegistrationApproval";

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
              user.role === "Admin" ? (
                <Navigate to="/admin" replace />
              ) : user.role === "FieldOwner" ? (
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
              user.role === "FieldOwner" ? (
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
              user.role === "FieldOwner" ? (
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
              user.role === "FieldOwner" ? (
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
              user.role === "FieldOwner" ? (
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
              user.role === "FieldOwner" ? (
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
              user.role === "FieldOwner" ? (
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
              user.role === "FieldOwner" ? (
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
          path="/owner/promotions"
          element={
            user ? (
              user.role === "FieldOwner" ? (
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
              user.role === "FieldOwner" ? (
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
              user.role === "Admin" ? (
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
              user.role === "Admin" ? (
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
              user.role === "Admin" ? (
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
              user.role === "Admin" ? (
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
              user.role === "Admin" ? (
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
              user.role === "Admin" ? (
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
              user.role === "Admin" ? (
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
