// File: BallSport.Infrastructure/Repositories/Community/NotificationRepository.cs
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories.Community
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly Sep490G19v1Context _context;

        public NotificationRepository(Sep490G19v1Context context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        // ===================== USER METHODS =====================
        public async Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId, int pageNumber = 1, int pageSize = 20, bool? isRead = null)
        {
            var query = _context.Notifications.Where(n => n.UserId == userId);

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
            var noti = await _context.Notifications.FindAsync(notificationId);
            if (noti == null) return false;

            noti.IsRead = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkAllAsReadAsync(int userId)
        {
            await _context.Notifications
                .Where(n => n.UserId == userId && (n.IsRead == false || n.IsRead == null))
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

            return true;
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId)
        {
            var noti = await _context.Notifications.FindAsync(notificationId);
            if (noti == null) return false;

            _context.Notifications.Remove(noti);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAllNotificationsAsync(int userId)
        {
            await _context.Notifications
                .Where(n => n.UserId == userId)
                .ExecuteDeleteAsync();

            return true;
        }

        // ===================== CREATE METHODS =====================
        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            notification.CreatedAt = DateTime.UtcNow;
            notification.IsRead = false;

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
            return notification;
        }

        public async Task<bool> CreateNotificationsAsync(IEnumerable<Notification> notifications)
        {
            if (!notifications.Any()) return true;

            var now = DateTime.UtcNow;
            foreach (var n in notifications)
            {
                n.CreatedAt = now;
                n.IsRead = false;
            }

            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();
            return true;
        }

        // ===================== ADMIN METHODS (ĐÃ BỎ HOÀN TOÀN UPDATE) =====================
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

        // ĐÃ XÓA HOÀN TOÀN UpdateNotificationAdminAsync → Không còn lỗi DTO!

        public async Task<bool> DeleteNotificationAdminAsync(int notificationId)
        {
            var noti = await _context.Notifications.FindAsync(notificationId);
            if (noti == null) return false;

            _context.Notifications.Remove(noti);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds)
        {
            if (notificationIds == null || !notificationIds.Any()) return 0;

            return await _context.Notifications
                .Where(n => notificationIds.Contains(n.NotificationId))
                .ExecuteDeleteAsync();
        }

        // ===================== MAINTENANCE =====================
        public async Task<bool> DeleteOldNotificationsAsync(int daysOld = 30)
        {
            var cutoff = DateTime.UtcNow.AddDays(-daysOld);
            var deletedCount = await _context.Notifications
                .Where(n => n.CreatedAt < cutoff)
                .ExecuteDeleteAsync();

            return deletedCount > 0;
        }
    }
}