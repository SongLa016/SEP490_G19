import { lazy } from "react";
import { ROLES } from "../constants/roles";

/**
 * Route Configuration - Tập trung quản lý tất cả routes
 * Giúp code dễ maintain và mở rộng
 */

// Loading fallback component
export const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
  </div>
);

// Lazy load pages - Tối ưu code splitting
const lazyLoad = (importFunc) => lazy(importFunc);

// Public pages
export const LandingPage = lazyLoad(() => import("../../pages/LandingPage"));

// Player pages
export const HomePage = lazyLoad(() =>
  import("../../roles/player/pages/home/HomePage")
);
export const Dashboard = lazyLoad(() =>
  import("../../roles/player/pages/dashboard/Dashboard")
);
export const BookingHistory = lazyLoad(() =>
  import("../../roles/player/pages/booking/BookingHistory")
);
export const PlayerNotificationsPage = lazyLoad(() =>
  import("../../roles/player/pages/notifications/NotificationsPage")
);
export const ComplexDetail = lazyLoad(() =>
  import("../../roles/player/pages/fields/ComplexDetail")
);
export const Community = lazyLoad(() =>
  import("../../roles/player/pages/community/Community")
);
export const FieldSearch = lazyLoad(() =>
  import("../../roles/player/pages/fields/FieldSearch")
);
export const ProfileIndex = lazyLoad(() =>
  import("../../roles/player/pages/profile")
);

// Owner pages
export const OwnerDashboard = lazyLoad(() =>
  import("../../roles/owner/pages/OwnerDashboard")
);
export const FieldManagement = lazyLoad(() =>
  import("../../roles/owner/pages/FieldManagement")
);
export const PricingManagement = lazyLoad(() =>
  import("../../roles/owner/pages/PricingManagement")
);
export const BookingManagement = lazyLoad(() =>
  import("../../roles/owner/pages/BookingManagement")
);
export const RevenueReports = lazyLoad(() =>
  import("../../roles/owner/pages/RevenueReports")
);
export const ScheduleManagement = lazyLoad(() =>
  import("../../roles/owner/pages/ScheduleManagement")
);
export const CancellationPolicies = lazyLoad(() =>
  import("../../roles/owner/pages/CancellationPolicies")
);
export const DepositPolicies = lazyLoad(() =>
  import("../../roles/owner/pages/DepositPolicies")
);
export const PromotionsManagement = lazyLoad(() =>
  import("../../roles/owner/pages/PromotionsManagement")
);
export const PaymentTracking = lazyLoad(() =>
  import("../../roles/owner/pages/PaymentTracking")
);
export const NotificationsManagement = lazyLoad(() =>
  import("../../roles/owner/pages/NotificationsManagement")
);
export const TimeSlotManagement = lazyLoad(() =>
  import("../../roles/owner/pages/TimeSlotManagement")
);
export const FieldTypeManagement = lazyLoad(() =>
  import("../../roles/owner/pages/FieldTypeManagement")
);
export const BankAccountManagement = lazyLoad(() =>
  import("../../roles/owner/pages/BankAccountManagement")
);
export const OwnerProfileSettings = lazyLoad(() =>
  import("../../roles/owner/pages/ProfileSettings")
);

// Admin pages
export const AdminDashboard = lazyLoad(() =>
  import("../../roles/admin/pages/AdminDashboard")
);
export const UserManagement = lazyLoad(() =>
  import("../../roles/admin/pages/UserManagement")
);
export const SystemNotificationsManagement = lazyLoad(() =>
  import("../../roles/admin/pages/SystemNotificationsManagement")
);
export const ViolationReportsManagement = lazyLoad(() =>
  import("../../roles/admin/pages/ViolationReportsManagement")
);
export const PostManagement = lazyLoad(() =>
  import("../../roles/admin/pages/PostManagement")
);
export const SystemSettings = lazyLoad(() =>
  import("../../roles/admin/pages/SystemSettings")
);
export const AdminProfileSettings = lazyLoad(() =>
  import("../../roles/admin/pages/ProfileSettings")
);

// Route definitions với metadata
export const routeConfig = [
  // Public routes
  {
    path: "/",
    element: LandingPage,
    public: true,
  },
  {
    path: "/notifications",
    element: PlayerNotificationsPage,
    layout: "MainLayout",
    allowedRoles: [ROLES.PLAYER.name],
  },
  // Note: Auth routes use AuthLayout directly, not lazy loaded
  // They are handled separately in App.js

  // Player routes
  {
    path: "/home",
    element: HomePage,
    layout: "MainLayout",
    requireAuth: false,
  },
  {
    path: "/dashboard",
    element: Dashboard,
    layout: "MainLayout",
    allowedRoles: [ROLES.PLAYER.name],
  },
  {
    path: "/search",
    element: FieldSearch,
    layout: "MainLayout",
    requireAuth: false,
  },
  {
    path: "/complex/:id",
    element: ComplexDetail,
    layout: "MainLayout",
    requireAuth: false,
  },
  {
    path: "/field/:id",
    element: ComplexDetail,
    layout: "MainLayout",
    requireAuth: false,
  },
  {
    path: "/bookings",
    element: BookingHistory,
    layout: "MainLayout",
    allowedRoles: [ROLES.PLAYER.name],
  },
  {
    path: "/community",
    element: Community,
    requireAuth: false,
  },
  {
    path: "/profile",
    element: ProfileIndex,
    layout: "MainLayout",
    requireAuth: true,
  },

  // Owner routes
  {
    path: "/owner",
    element: OwnerDashboard,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/fields",
    element: FieldManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/field-types",
    element: FieldTypeManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/timeslots",
    element: TimeSlotManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/schedule",
    element: ScheduleManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/pricing",
    element: PricingManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/bookings",
    element: BookingManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/reports",
    element: RevenueReports,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/policies",
    element: CancellationPolicies,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/deposit-policies",
    element: DepositPolicies,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/promotions",
    element: PromotionsManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/notifications",
    element: NotificationsManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/bank-accounts",
    element: BankAccountManagement,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },
  {
    path: "/owner/profile",
    element: OwnerProfileSettings,
    layout: "OwnerLayout",
    allowedRoles: [ROLES.OWNER.name],
  },

  // Admin routes
  {
    path: "/admin",
    element: AdminDashboard,
    layout: "AdminLayout",
    allowedRoles: [ROLES.ADMIN.name],
  },
  {
    path: "/admin/users",
    element: UserManagement,
    layout: "AdminLayout",
    allowedRoles: [ROLES.ADMIN.name],
  },
  {
    path: "/admin/notifications",
    element: SystemNotificationsManagement,
    layout: "AdminLayout",
    allowedRoles: [ROLES.ADMIN.name],
  },
  {
    path: "/admin/violations",
    element: ViolationReportsManagement,
    layout: "AdminLayout",
    allowedRoles: [ROLES.ADMIN.name],
  },
  {
    path: "/admin/posts",
    element: PostManagement,
    layout: "AdminLayout",
    allowedRoles: [ROLES.ADMIN.name],
  },
  {
    path: "/admin/system-settings",
    element: SystemSettings,
    layout: "AdminLayout",
    allowedRoles: [ROLES.ADMIN.name],
  },
  {
    path: "/admin/profile",
    element: AdminProfileSettings,
    layout: "AdminLayout",
    allowedRoles: [ROLES.ADMIN.name],
  },
];

// Demo routes (optional - có thể xóa nếu không cần)
export const demoRoutes = [
  {
    path: "/demo",
    element: OwnerDashboard,
    isDemo: true,
  },
  {
    path: "/demo/fields",
    element: FieldManagement,
    isDemo: true,
  },
  {
    path: "/demo/timeslots",
    element: TimeSlotManagement,
    isDemo: true,
  },
  {
    path: "/demo/pricing",
    element: PricingManagement,
    isDemo: true,
  },
  {
    path: "/demo/bookings",
    element: BookingManagement,
    isDemo: true,
  },
  {
    path: "/demo/reports",
    element: RevenueReports,
    isDemo: true,
  },
  {
    path: "/demo/schedule",
    element: ScheduleManagement,
    isDemo: true,
  },
  {
    path: "/demo/policies",
    element: CancellationPolicies,
    isDemo: true,
  },
  {
    path: "/demo/deposit-policies",
    element: DepositPolicies,
    isDemo: true,
  },
  {
    path: "/demo/promotions",
    element: PromotionsManagement,
    isDemo: true,
  },
  {
    path: "/demo/payments",
    element: PaymentTracking,
    isDemo: true,
  },
  {
    path: "/demo/notifications",
    element: NotificationsManagement,
    isDemo: true,
  },
  {
    path: "/demo/bank-accounts",
    element: BankAccountManagement,
    isDemo: true,
  },
];
