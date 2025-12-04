// File: BallSport.Application/Services/Community/INotificationService.cs
using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    public interface INotificationService
    {
        // ===================== USER METHODS (GIỮ NGUYÊN) =====================
        Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId, int pageNumber, int pageSize, bool? isRead = null);

        Task<IEnumerable<NotificationDTO>> GetLatestNotificationsAsync(int userId, int topCount = 10);

        Task<NotificationDTO> CreateNotificationAsync(CreateNotificationDTO createNotificationDto);

        Task<bool> CreateBulkNotificationsAsync(IEnumerable<CreateNotificationDTO> notificationDtos);

        Task<bool> MarkAsReadAsync(int notificationId, int userId);

        Task<bool> MarkAllAsReadAsync(int userId);

        Task<bool> DeleteNotificationAsync(int notificationId, int userId);

        Task<bool> DeleteAllNotificationsAsync(int userId);

        Task<int> GetUnreadCountAsync(int userId);

        Task<IEnumerable<NotificationDTO>> GetNotificationsByTypeAsync(int userId, string type);

        Task<bool> CleanupOldNotificationsAsync(int daysOld = 30);

        // ===================== ADMIN METHODS – ĐÃ BỎ HOÀN TOÀN UPDATE =====================
        /// <summary>
        /// [Admin] Lấy toàn bộ thông báo trong hệ thống (có tìm kiếm, lọc)
        /// </summary>
        Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetAllNotificationsAdminAsync(
            int pageNumber = 1,
            int pageSize = 20,
            string? search = null,           // Đổi từ searchTitle → search cho chuẩn
            string? type = null,
            int? userId = null,
            bool? isRead = null);

        /// <summary>
        /// [Admin] Lấy chi tiết 1 thông báo bất kỳ
        /// </summary>
        Task<NotificationDTO?> GetNotificationByIdAdminAsync(int notificationId);

        /// <summary>
        /// [Admin] Xóa 1 thông báo bất kỳ
        /// </summary>
        Task<bool> DeleteNotificationAdminAsync(int notificationId);

        /// <summary>
        /// [Admin] Xóa nhiều thông báo cùng lúc
        /// </summary>
        Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds);

        // ĐÃ XÓA HOÀN TOÀN:
        // Task<bool> UpdateNotificationAdminAsync(...) → Không tồn tại nữa!
        // Không dùng UpdateNotificationAdminDTO → Xóa luôn file nếu có!
    }
}