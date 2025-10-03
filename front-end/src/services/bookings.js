// Mocked booking/payment services

export async function createPendingBooking({
  fieldId,
  date,
  slotId,
  customer,
}) {
  // Simulate creating a pending booking and returning a QR session
  return {
    bookingId: Math.floor(Math.random() * 1000000),
    status: "Pending",
    qrCodeUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BOOKING",
    qrExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

export async function confirmPayment({ bookingId, method }) {
  // Simulate payment confirmation
  return { bookingId, status: "Confirmed", paymentStatus: "Paid" };
}
