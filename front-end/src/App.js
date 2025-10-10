import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { getCurrentUser } from "./utils/authStore";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/dashboard/Dashboard";
import FieldSearch from "./pages/fields/FieldSearch";
import FieldDetail from "./pages/fields/FieldDetail";
import ComplexDetail from "./pages/fields/ComplexDetail";
import BookingHistory from "./pages/booking/BookingHistory";
import Community from "./pages/community/Community";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Booking from "./pages/booking/Booking";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setUser(u);
    }
    setIsLoading(false);
  }, []);

  function handleLoggedIn(newUser) {
    setUser(newUser);
  }

  function handleLoggedOut() {
    setUser(null);
  }

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
              <Dashboard user={user} onLoggedOut={handleLoggedOut} />
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
              <FieldDetail user={user} />
            </MainLayout>
          }
        />
        <Route
          path="/bookings"
          element={
            <MainLayout>
              <Booking user={user} />
            </MainLayout>
          }
        />
        <Route
          path="/community"
          element={
            <MainLayout>
              <Community user={user} />
            </MainLayout>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
