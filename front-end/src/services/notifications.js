// Service for managing notifications
// Mock data for notifications

const NOTIFICATIONS = [
  {
    NotificationID: 1,
    OwnerID: 1,
    ComplexID: 101,
    Title: "Sân bị hỏng - Hủy đặt sân",
    Message:
      "Xin lỗi, sân số 1 bị hỏng hệ thống chiếu sáng. Chúng tôi sẽ hủy đặt sân của bạn và hoàn tiền 100%.",
    Type: "cancellation", // cancellation, maintenance, update, promotion
    Priority: "high", // low, medium, high, urgent
    TargetAudience: "booking_users", // all_users, booking_users, specific_users
    TargetBookingIds: [1001, 1002, 1003],
    IsActive: true,
    SentAt: "2024-01-15T10:30:00Z",
    CreatedAt: "2024-01-15T10:00:00Z",
    UpdatedAt: "2024-01-15T10:00:00Z",
  },
  {
    NotificationID: 2,
    OwnerID: 2,
    ComplexID: 102,
    Title: "Bảo trì định kỳ",
    Message:
      "Sân sẽ được bảo trì từ 14:00-16:00 ngày mai. Các slot trong thời gian này sẽ không khả dụng.",
    Type: "maintenance",
    Priority: "medium",
    TargetAudience: "all_users",
    TargetBookingIds: [],
    IsActive: true,
    SentAt: "2024-01-14T15:00:00Z",
    CreatedAt: "2024-01-14T14:30:00Z",
    UpdatedAt: "2024-01-14T14:30:00Z",
  },
  {
    NotificationID: 3,
    OwnerID: 1,
    ComplexID: 101,
    Title: "Khuyến mãi đặc biệt",
    Message:
      "Giảm giá 20% cho tất cả slot cuối tuần! Sử dụng mã WEEKEND20 để nhận ưu đãi.",
    Type: "promotion",
    Priority: "low",
    TargetAudience: "all_users",
    TargetBookingIds: [],
    IsActive: true,
    SentAt: "2024-01-13T09:00:00Z",
    CreatedAt: "2024-01-13T08:30:00Z",
    UpdatedAt: "2024-01-13T08:30:00Z",
  },
  {
    NotificationID: 4,
    OwnerID: 2,
    ComplexID: 103,
    Title: "Cập nhật giá dịch vụ",
    Message:
      "Từ ngày 1/2/2024, giá dịch vụ sẽ tăng 10%. Đặt sân trước ngày này để giữ giá cũ.",
    Type: "update",
    Priority: "medium",
    TargetAudience: "all_users",
    TargetBookingIds: [],
    IsActive: true,
    SentAt: "2024-01-12T11:00:00Z",
    CreatedAt: "2024-01-12T10:30:00Z",
    UpdatedAt: "2024-01-12T10:30:00Z",
  },
  {
    NotificationID: 5,
    OwnerID: 2,
    ComplexID: 104,
    Title: "Thời tiết xấu",
    Message:
      "Do thời tiết mưa to, sân có thể không sử dụng được. Vui lòng liên hệ để được hỗ trợ.",
    Type: "cancellation",
    Priority: "urgent",
    TargetAudience: "booking_users",
    TargetBookingIds: [2001, 2002],
    IsActive: true,
    SentAt: "2024-01-11T08:00:00Z",
    CreatedAt: "2024-01-11T07:30:00Z",
    UpdatedAt: "2024-01-11T07:30:00Z",
  },
  {
    NotificationID: 6,
    OwnerID: 1,
    ComplexID: 101,
    Title: "Cải thiện dịch vụ",
    Message:
      "Chúng tôi đã nâng cấp hệ thống đặt sân và cải thiện chất lượng dịch vụ. Cảm ơn bạn đã tin tưởng!",
    Type: "update",
    Priority: "low",
    TargetAudience: "all_users",
    TargetBookingIds: [],
    IsActive: true,
    SentAt: "2024-01-10T16:00:00Z",
    CreatedAt: "2024-01-10T15:30:00Z",
    UpdatedAt: "2024-01-10T15:30:00Z",
  },
  {
    NotificationID: 7,
    OwnerID: 2,
    ComplexID: 102,
    Title: "Khuyến mãi sinh nhật",
    Message:
      "Chúc mừng sinh nhật! Bạn được giảm giá 50% cho đặt sân trong tuần này. Sử dụng mã BIRTHDAY50.",
    Type: "promotion",
    Priority: "medium",
    TargetAudience: "all_users",
    TargetBookingIds: [],
    IsActive: true,
    SentAt: "2024-01-09T12:00:00Z",
    CreatedAt: "2024-01-09T11:30:00Z",
    UpdatedAt: "2024-01-09T11:30:00Z",
  },
  {
    NotificationID: 8,
    OwnerID: 2,
    ComplexID: 105,
    Title: "Sân tạm thời đóng cửa",
    Message:
      "Sân sẽ tạm thời đóng cửa từ ngày 20/1 đến 25/1 để sửa chữa. Chúng tôi sẽ liên hệ để hủy/hoãn đặt sân.",
    Type: "cancellation",
    Priority: "high",
    TargetAudience: "booking_users",
    TargetBookingIds: [3001, 3002, 3003],
    IsActive: true,
    SentAt: "2024-01-08T14:00:00Z",
    CreatedAt: "2024-01-08T13:30:00Z",
    UpdatedAt: "2024-01-08T13:30:00Z",
  },
];

// User notifications (notifications received by users)
const USER_NOTIFICATIONS = [
  {
    UserNotificationID: 1,
    UserID: 1,
    NotificationID: 1,
    IsRead: false,
    ReadAt: null,
    ReceivedAt: "2024-01-15T10:30:00Z",
  },
  {
    UserNotificationID: 2,
    UserID: 2,
    NotificationID: 1,
    IsRead: true,
    ReadAt: "2024-01-15T11:00:00Z",
    ReceivedAt: "2024-01-15T10:30:00Z",
  },
  {
    UserNotificationID: 3,
    UserID: 3,
    NotificationID: 2,
    IsRead: false,
    ReadAt: null,
    ReceivedAt: "2024-01-14T15:00:00Z",
  },
  {
    UserNotificationID: 4,
    UserID: 1,
    NotificationID: 3,
    IsRead: true,
    ReadAt: "2024-01-13T10:00:00Z",
    ReceivedAt: "2024-01-13T09:00:00Z",
  },
  {
    UserNotificationID: 5,
    UserID: 2,
    NotificationID: 4,
    IsRead: false,
    ReadAt: null,
    ReceivedAt: "2024-01-12T11:00:00Z",
  },
  {
    UserNotificationID: 6,
    UserID: 4,
    NotificationID: 5,
    IsRead: true,
    ReadAt: "2024-01-11T09:00:00Z",
    ReceivedAt: "2024-01-11T08:00:00Z",
  },
  {
    UserNotificationID: 7,
    UserID: 1,
    NotificationID: 6,
    IsRead: false,
    ReadAt: null,
    ReceivedAt: "2024-01-10T16:00:00Z",
  },
  {
    UserNotificationID: 8,
    UserID: 2,
    NotificationID: 7,
    IsRead: true,
    ReadAt: "2024-01-09T13:00:00Z",
    ReceivedAt: "2024-01-09T12:00:00Z",
  },
  {
    UserNotificationID: 9,
    UserID: 3,
    NotificationID: 8,
    IsRead: false,
    ReadAt: null,
    ReceivedAt: "2024-01-08T14:00:00Z",
  },
  {
    UserNotificationID: 10,
    UserID: 4,
    NotificationID: 8,
    IsRead: true,
    ReadAt: "2024-01-08T15:00:00Z",
    ReceivedAt: "2024-01-08T14:00:00Z",
  },
];

// Helper functions
function findNotification(notificationId) {
  return NOTIFICATIONS.find((n) => n.NotificationID === Number(notificationId));
}

function findNotificationsByOwner(ownerId) {
  return NOTIFICATIONS.filter((n) => n.OwnerID === Number(ownerId));
}

function findNotificationsByComplex(complexId) {
  return NOTIFICATIONS.filter((n) => n.ComplexID === Number(complexId));
}

function findUserNotifications(userId) {
  return USER_NOTIFICATIONS.filter((un) => un.UserID === Number(userId));
}

// API functions
export async function fetchNotifications(ownerId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const notifications = findNotificationsByOwner(ownerId);
  return notifications.map((notification) => ({
    notificationId: notification.NotificationID,
    ownerId: notification.OwnerID,
    complexId: notification.ComplexID,
    title: notification.Title,
    message: notification.Message,
    type: notification.Type,
    priority: notification.Priority,
    targetAudience: notification.TargetAudience,
    targetBookingIds: notification.TargetBookingIds,
    isActive: notification.IsActive,
    sentAt: notification.SentAt,
    createdAt: notification.CreatedAt,
    updatedAt: notification.UpdatedAt,
  }));
}

export async function fetchNotification(notificationId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const notification = findNotification(notificationId);
  if (!notification) return null;

  return {
    notificationId: notification.NotificationID,
    ownerId: notification.OwnerID,
    complexId: notification.ComplexID,
    title: notification.Title,
    message: notification.Message,
    type: notification.Type,
    priority: notification.Priority,
    targetAudience: notification.TargetAudience,
    targetBookingIds: notification.TargetBookingIds,
    isActive: notification.IsActive,
    sentAt: notification.SentAt,
    createdAt: notification.CreatedAt,
    updatedAt: notification.UpdatedAt,
  };
}

export async function fetchUserNotifications(userId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const userNotifications = findUserNotifications(userId);
  const notifications = userNotifications.map((un) => {
    const notification = findNotification(un.NotificationID);
    return {
      userNotificationId: un.UserNotificationID,
      notificationId: notification.NotificationID,
      title: notification.Title,
      message: notification.Message,
      type: notification.Type,
      priority: notification.Priority,
      isRead: un.IsRead,
      readAt: un.ReadAt,
      receivedAt: un.ReceivedAt,
      sentAt: notification.SentAt,
    };
  });

  return notifications.sort(
    (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)
  );
}

export async function createNotification(notificationData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newNotification = {
    NotificationID: NOTIFICATIONS.length + 1,
    OwnerID: notificationData.ownerId,
    ComplexID: notificationData.complexId,
    Title: notificationData.title,
    Message: notificationData.message,
    Type: notificationData.type,
    Priority: notificationData.priority,
    TargetAudience: notificationData.targetAudience,
    TargetBookingIds: notificationData.targetBookingIds || [],
    IsActive: true,
    SentAt: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };

  NOTIFICATIONS.push(newNotification);

  // Simulate sending to users
  if (notificationData.targetAudience === "all_users") {
    // Send to all users (simulate)
    console.log("Sending notification to all users:", newNotification.Title);
  } else if (notificationData.targetAudience === "booking_users") {
    // Send to specific booking users (simulate)
    console.log(
      "Sending notification to booking users:",
      newNotification.Title
    );
  }

  return {
    notificationId: newNotification.NotificationID,
    ownerId: newNotification.OwnerID,
    complexId: newNotification.ComplexID,
    title: newNotification.Title,
    message: newNotification.Message,
    type: newNotification.Type,
    priority: newNotification.Priority,
    targetAudience: newNotification.TargetAudience,
    targetBookingIds: newNotification.TargetBookingIds,
    isActive: newNotification.IsActive,
    sentAt: newNotification.SentAt,
    createdAt: newNotification.CreatedAt,
    updatedAt: newNotification.UpdatedAt,
  };
}

export async function updateNotification(notificationId, notificationData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const notificationIndex = NOTIFICATIONS.findIndex(
    (n) => n.NotificationID === Number(notificationId)
  );
  if (notificationIndex === -1) {
    throw new Error("Notification not found");
  }

  const updatedNotification = {
    ...NOTIFICATIONS[notificationIndex],
    Title: notificationData.title,
    Message: notificationData.message,
    Type: notificationData.type,
    Priority: notificationData.priority,
    TargetAudience: notificationData.targetAudience,
    TargetBookingIds: notificationData.targetBookingIds || [],
    UpdatedAt: new Date().toISOString(),
  };

  NOTIFICATIONS[notificationIndex] = updatedNotification;

  return {
    notificationId: updatedNotification.NotificationID,
    ownerId: updatedNotification.OwnerID,
    complexId: updatedNotification.ComplexID,
    title: updatedNotification.Title,
    message: updatedNotification.Message,
    type: updatedNotification.Type,
    priority: updatedNotification.Priority,
    targetAudience: updatedNotification.TargetAudience,
    targetBookingIds: updatedNotification.TargetBookingIds,
    isActive: updatedNotification.IsActive,
    sentAt: updatedNotification.SentAt,
    createdAt: updatedNotification.CreatedAt,
    updatedAt: updatedNotification.UpdatedAt,
  };
}

export async function deleteNotification(notificationId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const notificationIndex = NOTIFICATIONS.findIndex(
    (n) => n.NotificationID === Number(notificationId)
  );
  if (notificationIndex === -1) {
    throw new Error("Notification not found");
  }

  NOTIFICATIONS.splice(notificationIndex, 1);

  return { success: true };
}

export async function markNotificationAsRead(userNotificationId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const userNotificationIndex = USER_NOTIFICATIONS.findIndex(
    (un) => un.UserNotificationID === Number(userNotificationId)
  );
  if (userNotificationIndex === -1) {
    throw new Error("User notification not found");
  }

  USER_NOTIFICATIONS[userNotificationIndex] = {
    ...USER_NOTIFICATIONS[userNotificationIndex],
    IsRead: true,
    ReadAt: new Date().toISOString(),
  };

  return { success: true };
}

export async function markAllNotificationsAsRead(userId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const userNotifications = findUserNotifications(userId);
  userNotifications.forEach((un) => {
    const index = USER_NOTIFICATIONS.findIndex(
      (u) => u.UserNotificationID === un.UserNotificationID
    );
    if (index !== -1) {
      USER_NOTIFICATIONS[index] = {
        ...USER_NOTIFICATIONS[index],
        IsRead: true,
        ReadAt: new Date().toISOString(),
      };
    }
  });

  return { success: true };
}

// Get notification statistics
export async function getNotificationStats(ownerId) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const notifications = findNotificationsByOwner(ownerId);
  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.IsActive).length,
    byType: {
      cancellation: notifications.filter((n) => n.Type === "cancellation")
        .length,
      maintenance: notifications.filter((n) => n.Type === "maintenance").length,
      update: notifications.filter((n) => n.Type === "update").length,
      promotion: notifications.filter((n) => n.Type === "promotion").length,
    },
    byPriority: {
      low: notifications.filter((n) => n.Priority === "low").length,
      medium: notifications.filter((n) => n.Priority === "medium").length,
      high: notifications.filter((n) => n.Priority === "high").length,
      urgent: notifications.filter((n) => n.Priority === "urgent").length,
    },
  };

  return stats;
}
