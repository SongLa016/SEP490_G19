// File: BallSport.Infrastructure/Repositories/Community/INotificationRepository.cs
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface INotificationRepository
    {
        // ===================== USER METHODS =====================
        Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId, int pageNumber = 1, int pageSize = 20, bool? isRead = null);

        Task<Notification?> GetNotificationByIdAsync(int notificationId);

        Task<int> CountUnreadNotificationsAsync(int userId);

        Task<IEnumerable<Notification>> GetLatestNotificationsAsync(int userId, int topCount = 10);

        Task<IEnumerable<Notification>> GetNotificationsByTypeAsync(int userId, string type);

        Task<bool> MarkAsReadAsync(int notificationId);

        Task<bool> MarkAllAsReadAsync(int userId);

        Task<bool> DeleteNotificationAsync(int notificationId);

        Task<bool> DeleteAllNotificationsAsync(int userId);

        // ===================== CREATE METHODS =====================
        Task<Notification> CreateNotificationAsync(Notification notification);

        Task<bool> CreateNotificationsAsync(IEnumerable<Notification> notifications);

        // ===================== ADMIN METHODS (ĐÃ BỎ HOÀN TOÀN UPDATE) =====================
        Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetAllNotificationsAdminAsync(
            int pageNumber = 1,
            int pageSize = 20,
            string? search = null,
            string? type = null,
            int? userId = null,
            bool? isRead = null);

        Task<Notification?> GetNotificationByIdAdminAsync(int notificationId);

        // ĐÃ XÓA: UpdateNotificationAdminAsync → Không cần nữa!

        Task<bool> DeleteNotificationAdminAsync(int notificationId);

        Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds);

        // ===================== MAINTENANCE =====================
        Task<bool> DeleteOldNotificationsAsync(int daysOld = 30);
    }
}