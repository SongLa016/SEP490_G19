// File: BallSport.Application/Services/Community/INotificationService.cs
using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    /// <summary>
    /// Service xử lý toàn bộ nghiệp vụ thông báo
    /// Hỗ trợ: Gửi cá nhân + Gửi toàn hệ thống (type = "System" + UserId = null)
    /// ĐÃ LOẠI BỎ HOÀN TOÀN chức năng Update (bảo mật cực cao)
    /// </summary>
    public interface INotificationService
    {
        // ===================== USER METHODS =====================
        Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId, int pageNumber = 1, int pageSize = 20, bool? isRead = null);

        Task<IEnumerable<NotificationDTO>> GetLatestNotificationsAsync(int userId, int topCount = 10);

        Task<NotificationDTO> CreateNotificationAsync(CreateNotificationDTO dto);

        Task<int> CreateBulkNotificationsAsync(IEnumerable<CreateNotificationDTO> dtos);

        Task<bool> MarkAsReadAsync(int notificationId, int userId);

        Task<bool> MarkAllAsReadAsync(int userId);

        Task<bool> DeleteNotificationAsync(int notificationId, int userId);

        Task<bool> DeleteAllNotificationsAsync(int userId);

        Task<int> GetUnreadCountAsync(int userId);

        Task<IEnumerable<NotificationDTO>> GetNotificationsByTypeAsync(int userId, string type);

        Task<int> CleanupOldNotificationsAsync(int daysOld = 30);

        // ===================== ADMIN METHODS =====================
        Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetAllNotificationsAdminAsync(
            int pageNumber = 1, int pageSize = 20,
            string? search = null, string? type = null, int? userId = null, bool? isRead = null);

        Task<NotificationDTO?> GetNotificationByIdAdminAsync(int notificationId);

        Task<bool> DeleteNotificationAdminAsync(int notificationId);  // Repository trả bool → Service trả bool

        Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds); // Repository trả int
    }
}