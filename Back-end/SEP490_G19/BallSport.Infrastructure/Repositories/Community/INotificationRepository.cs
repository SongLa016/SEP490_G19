// File: BallSport.Infrastructure/Repositories/Community/INotificationRepository.cs
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    /// <summary>
    /// Repository xử lý toàn bộ thao tác với bảng Notifications
    /// ĐÃ LOẠI BỎ HOÀN TOÀN chức năng Update (theo yêu cầu bảo mật)
    /// </summary>
    public interface INotificationRepository
    {
        // ===================== USER METHODS =====================
        Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId,
            int pageNumber = 1,
            int pageSize = 20,
            bool? isRead = null);

        Task<Notification?> GetNotificationByIdAsync(int notificationId);

        Task<int> CountUnreadNotificationsAsync(int userId);

        Task<IEnumerable<Notification>> GetLatestNotificationsAsync(int userId, int topCount = 10);

        Task<IEnumerable<Notification>> GetNotificationsByTypeAsync(int userId, string type);

        Task<bool> MarkAsReadAsync(int notificationId);

        Task<bool> MarkAllAsReadAsync(int userId);

        Task<bool> DeleteNotificationAsync(int notificationId);

        Task<bool> DeleteAllNotificationsAsync(int userId);

        // ===================== CREATE METHODS =====================
        /// <summary>
        /// Tạo 1 thông báo duy nhất
        /// </summary>
        Task<Notification> CreateNotificationAsync(Notification notification);

        /// <summary>
        /// Tạo hàng loạt thông báo (dùng cho gửi toàn hệ thống)
        /// Trả về số lượng bản ghi đã insert thành công
        /// </summary>
        Task<int> CreateNotificationsAsync(IEnumerable<Notification> notifications);

        // ===================== ADMIN METHODS =====================
        /// <summary>
        /// [Admin] Lấy danh sách toàn bộ thông báo trong hệ thống (có phân trang + lọc)
        /// </summary>
        Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetAllNotificationsAdminAsync(
            int pageNumber = 1,
            int pageSize = 20,
            string? search = null,
            string? type = null,
            int? userId = null,
            bool? isRead = null);

        /// <summary>
        /// [Admin] Lấy chi tiết 1 thông báo bất kỳ (không cần kiểm tra owner)
        /// </summary>
        Task<Notification?> GetNotificationByIdAdminAsync(int notificationId);

        /// <summary>
        /// [Admin] Xóa 1 thông báo bất kỳ
        /// </summary>
        Task<bool> DeleteNotificationAdminAsync(int notificationId);

        /// <summary>
        /// [Admin] Xóa hàng loạt thông báo theo danh sách ID
        /// Trả về số lượng đã xóa thành công
        /// </summary>
        Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds);


        // ===================== MAINTENANCE =====================
        /// <summary>
        /// Xóa các thông báo cũ hơn X ngày (dùng cho cleanup định kỳ)
        /// </summary>
        Task<int> DeleteOldNotificationsAsync(int daysOld = 30);
    }
}