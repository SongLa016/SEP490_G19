// Shared components exports
export * from "./components/ui";
export { default as AddressPicker } from "./components/AddressPicker";
export { default as BookingModal } from "./components/BookingModal";
export { default as CancellationPolicyDisplay } from "./components/CancellationPolicyDisplay";
export { default as CancelBookingModal } from "./components/CancelBookingModal";
export { default as DemoAccountPromotionManager } from "./components/DemoAccountPromotionManager";
export { default as DemoRestrictedModal } from "./components/DemoRestrictedModal";
export { default as EmailVerificationModal } from "./components/EmailVerificationModal";
export { default as ErrorDisplay } from "./components/ErrorDisplay";
export { default as FindOpponentModal } from "./components/FindOpponentModal";
export { default as ForgotPasswordModal } from "./components/ForgotPasswordModal";
export { default as NotificationsDisplay } from "./components/NotificationsDisplay";
export { default as PromotionCodeSection } from "./components/PromotionCodeSection";
export { default as PromotionsDisplay } from "./components/PromotionsDisplay";
export { default as QuickAddFieldType } from "./components/QuickAddFieldType";
export { default as FieldTypeCombobox } from "./components/FieldTypeCombobox";
export { default as RatingModal } from "./components/RatingModal";
export { default as RecurringOpponentModal } from "./components/RecurringOpponentModal";
export { default as RecurringOpponentSelection } from "./components/RecurringOpponentSelection";
export { default as RescheduleModal } from "./components/RescheduleModal";

// Shared services exports
export * from "./services/authService";
export * from "./services/bankingService";
// Export bookings services with specific names to avoid conflicts
export {
  createPendingBooking,
  confirmPayment,
  checkFieldAvailability,
  validateBookingData,
  createBooking as createBookingAPI,
  createBookingPackage,
  fetchBookingPackagesByPlayer,
  confirmPaymentAPI,
  generateQRCode,
  confirmByOwner,
  fetchBookingsByPlayer,
  fetchBookingsByOwner,
  fetchCancellationRequestById,
  cancelBooking,
} from "./services/bookings";
export * from "./services/matchRequests";
export * from "./services/cancellationPolicies";
export * from "./services/depositPolicies";
export * from "./services/fields";
export * from "./services/notifications";
export * from "./services/ownerBankAccount";
export * from "./services/fieldSchedules";
export * from "./services/passwordResetService";
export * from "./services/profileService";
export * from "./services/promotions";
export * from "./services/favorites";
export * from "./services/timeSlots";
export * from "./services/fieldTypes";
export * from "./services/posts";
export * from "./services/ratings";
export * from "./utils/authStore";
export * from "./utils/bookingStore";
export * from "./utils/cancellationCalculator";
export * from "./utils/communityStore";
export * from "./utils/demoData";
// Export roleMapping with specific exports to avoid conflicts with authStore
// Note: hasRole and hasAnyRole are already exported from authStore, so we don't export them from roleMapping
export { roleMapping } from "./utils/roleMapping";
export {
  getRoleById,
  getRoleByName,
  getRoleDisplayName,
  getRoleColor,
  isValidRoleId,
  isValidRoleName,
  getAllRoles,
  ROLES,
  isPlayer,
  isOwner,
  isAdmin,
  getDefaultPathForRole,
  // hasRole and hasAnyRole are NOT exported here to avoid conflict with authStore
  // Use from authStore or import directly from constants/roles if needed
} from "./utils/roleMapping";
