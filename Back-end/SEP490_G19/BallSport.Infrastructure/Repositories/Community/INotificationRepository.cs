using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface INotificationRepository
    {
        // Lấy thông báo của user (có phân trang)
        Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId,
            int pageNumber,
            int pageSize,
            bool? isRead = null);

        // Lấy thông báo theo ID
        Task<Notification?> GetNotificationByIdAsync(int notificationId);

        // Tạo thông báo mới
        Task<Notification> CreateNotificationAsync(Notification notification);

        // Tạo nhiều thông báo cùng lúc (bulk insert)
        Task<bool> CreateNotificationsAsync(IEnumerable<Notification> notifications);

        // Đánh dấu đã đọc
        Task<bool> MarkAsReadAsync(int notificationId);

        // Đánh dấu tất cả là đã đọc
        Task<bool> MarkAllAsReadAsync(int userId);

        // Xóa thông báo
        Task<bool> DeleteNotificationAsync(int notificationId);

        // Xóa tất cả thông báo của user
        Task<bool> DeleteAllNotificationsAsync(int userId);

        // Đếm thông báo chưa đọc
        Task<int> CountUnreadNotificationsAsync(int userId);

        // Lấy thông báo mới nhất (top N)
        Task<IEnumerable<Notification>> GetLatestNotificationsAsync(int userId, int topCount = 10);

        // Xóa thông báo cũ (quá X ngày)
        Task<bool> DeleteOldNotificationsAsync(int daysOld = 30);

        // Lấy thông báo theo loại
        Task<IEnumerable<Notification>> GetNotificationsByTypeAsync(int userId, string type);
    }
}