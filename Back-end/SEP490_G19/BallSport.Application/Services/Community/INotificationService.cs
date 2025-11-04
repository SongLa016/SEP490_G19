using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    public interface INotificationService
    {
        // Lấy thông báo của user (có phân trang)
        Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId,
            int pageNumber,
            int pageSize,
            bool? isRead = null);

        // Lấy thông báo mới nhất
        Task<IEnumerable<NotificationDTO>> GetLatestNotificationsAsync(int userId, int topCount = 10);

        // Tạo thông báo
        Task<NotificationDTO> CreateNotificationAsync(CreateNotificationDTO createNotificationDto);

        // Tạo nhiều thông báo cùng lúc
        Task<bool> CreateBulkNotificationsAsync(IEnumerable<CreateNotificationDTO> notificationDtos);

        // Đánh dấu đã đọc
        Task<bool> MarkAsReadAsync(int notificationId, int userId);

        // Đánh dấu tất cả là đã đọc
        Task<bool> MarkAllAsReadAsync(int userId);

        // Xóa thông báo
        Task<bool> DeleteNotificationAsync(int notificationId, int userId);

        // Xóa tất cả thông báo
        Task<bool> DeleteAllNotificationsAsync(int userId);

        // Đếm thông báo chưa đọc
        Task<int> GetUnreadCountAsync(int userId);

        // Lấy thông báo theo loại
        Task<IEnumerable<NotificationDTO>> GetNotificationsByTypeAsync(int userId, string type);

        // Cleanup thông báo cũ (background job)
        Task<bool> CleanupOldNotificationsAsync(int daysOld = 30);
    }
}