import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/dashboard/Dashboard";
import FieldSearch from "./pages/fields/FieldSearch";

import BookingHistory from "./pages/booking/BookingHistory";
import ComplexDetail from "./pages/fields/ComplexDetail";
import Community from "./pages/community/Community";

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
            user ? <Dashboard user={user} /> : <Navigate to="/auth" replace />
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

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
