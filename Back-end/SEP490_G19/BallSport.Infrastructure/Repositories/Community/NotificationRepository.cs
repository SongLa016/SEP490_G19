// File: BallSport.Infrastructure/Repositories/Community/NotificationRepository.cs
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BallSport.Infrastructure.Repositories.Community
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly Sep490G19v1Context _context;
        private readonly ILogger<NotificationRepository> _logger;

        public NotificationRepository(Sep490G19v1Context context, ILogger<NotificationRepository> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // ===================== USER METHODS =====================
        public async Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId, int pageNumber = 1, int pageSize = 20, bool? isRead = null)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId);

            if (isRead.HasValue)
                query = query.Where(n => n.IsRead == isRead.Value);

            var totalCount = await query.CountAsync();

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            return (notifications, totalCount);
        }

        public async Task<Notification?> GetNotificationByIdAsync(int notificationId)
            => await _context.Notifications
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

        public async Task<int> CountUnreadNotificationsAsync(int userId)
            => await _context.Notifications
                .CountAsync(n => n.UserId == userId && (n.IsRead == false || n.IsRead == null));

        public async Task<IEnumerable<Notification>> GetLatestNotificationsAsync(int userId, int topCount = 10)
            => await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(topCount)
                .AsNoTracking()
                .ToListAsync();

        public async Task<IEnumerable<Notification>> GetNotificationsByTypeAsync(int userId, string type)
            => await _context.Notifications
                .Where(n => n.UserId == userId && n.Type == type)
                .OrderByDescending(n => n.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

        public async Task<bool> MarkAsReadAsync(int notificationId)
        {
            var affected = await _context.Notifications
                .Where(n => n.NotificationId == notificationId)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

            return affected > 0;
        }

        public async Task<bool> MarkAllAsReadAsync(int userId)
        {
            var affected = await _context.Notifications
                .Where(n => n.UserId == userId && (n.IsRead == false || n.IsRead == null))
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

            return affected > 0;
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId)
        {
            var affected = await _context.Notifications
                .Where(n => n.NotificationId == notificationId)
                .ExecuteDeleteAsync();

            return affected > 0;
        }

        public async Task<bool> DeleteAllNotificationsAsync(int userId)
        {
            var affected = await _context.Notifications
                .Where(n => n.UserId == userId)
                .ExecuteDeleteAsync();

            return affected > 0;
        }

        // ===================== CREATE METHODS =====================
        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            if (notification == null) throw new ArgumentNullException(nameof(notification));

            notification.CreatedAt = DateTime.Now;
            notification.IsRead = false;

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();

            return notification;
        }

        /// <summary>
        /// Tạo hàng loạt thông báo – dùng cho gửi toàn hệ thống
        /// Trả về số lượng bản ghi đã insert thành công
        /// </summary>
        public async Task<int> CreateNotificationsAsync(IEnumerable<Notification> notifications)
        {
            if (notifications == null || !notifications.Any())
            {
                _logger.LogWarning("CreateNotificationsAsync called with null or empty collection.");
                return 0;
            }

            var now = DateTime.Now;
            var count = 0;

            foreach (var n in notifications)
            {
                n.CreatedAt = now;
                n.IsRead = false;
                count++;
            }

            try
            {
                await _context.Notifications.AddRangeAsync(notifications);
                var inserted = await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully inserted {Count} notifications.", inserted);
                return inserted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while bulk inserting notifications.");
                throw;
            }
        }

        // ===================== ADMIN METHODS =====================
        public async Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetAllNotificationsAdminAsync(
            int pageNumber = 1,
            int pageSize = 20,
            string? search = null,
            string? type = null,
            int? userId = null,
            bool? isRead = null)
        {
            var query = _context.Notifications
                .Include(n => n.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(n => n.Message != null && EF.Functions.Like(n.Message, $"%{search}%"));

            if (!string.IsNullOrWhiteSpace(type))
                query = query.Where(n => n.Type == type);

            if (userId.HasValue)
                query = query.Where(n => n.UserId == userId.Value);

            if (isRead.HasValue)
                query = query.Where(n => n.IsRead == isRead.Value);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<Notification?> GetNotificationByIdAdminAsync(int notificationId)
            => await _context.Notifications
                .Include(n => n.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

        public async Task<bool> DeleteNotificationAdminAsync(int notificationId)
        {
            var affected = await _context.Notifications
                .Where(n => n.NotificationId == notificationId)
                .ExecuteDeleteAsync();

            return affected > 0;
        }

        public async Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds)
        {
            if (notificationIds == null || !notificationIds.Any())
                return 0;

            return await _context.Notifications
                .Where(n => notificationIds.Contains(n.NotificationId))
                .ExecuteDeleteAsync();
        }

        // ===================== MAINTENANCE =====================
        public async Task<int> DeleteOldNotificationsAsync(int daysOld = 30)
        {
            var cutoff = DateTime.Now.AddDays(-daysOld);
            var deletedCount = await _context.Notifications
                .Where(n => n.CreatedAt < cutoff)
                .ExecuteDeleteAsync();

            _logger.LogInformation("Cleaned up {Count} old notifications (older than {Days} days).", deletedCount, daysOld);
            return deletedCount;
        }
    }
}