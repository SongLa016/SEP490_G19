 
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using BallSport.Infrastructure.Data;

namespace BallSport.Infrastructure.Repositories.Community
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly Sep490G19v1Context _context;

        public NotificationRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<Notification> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId,
            int pageNumber,
            int pageSize,
            bool? isRead = null)
        {
            var query = _context.Notifications
                .Include(n => n.User)
                .Where(n => n.UserId == userId);

            if (isRead.HasValue)
            {
                query = query.Where(n => n.IsRead == isRead.Value);
            }

            query = query.OrderByDescending(n => n.CreatedAt);

            var totalCount = await query.CountAsync();
            var notifications = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (notifications, totalCount);
        }

        public async Task<Notification?> GetNotificationByIdAsync(int notificationId)
        {
            return await _context.Notifications
                .Include(n => n.User)
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId);
        }

        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            notification.CreatedAt = DateTime.Now;
            notification.IsRead = false;

            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();

            return notification;
        }

        public async Task<bool> CreateNotificationsAsync(IEnumerable<Notification> notifications)
        {
            foreach (var notification in notifications)
            {
                notification.CreatedAt = DateTime.Now;
                notification.IsRead = false;
            }

            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> MarkAsReadAsync(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
                return false;

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> MarkAllAsReadAsync(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && (n.IsRead == false || n.IsRead == null))
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
                return false;

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAllNotificationsAsync(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .ToListAsync();

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<int> CountUnreadNotificationsAsync(int userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && (n.IsRead == false || n.IsRead == null))
                .CountAsync();
        }

        public async Task<IEnumerable<Notification>> GetLatestNotificationsAsync(int userId, int topCount = 10)
        {
            return await _context.Notifications
                .Include(n => n.User)
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(topCount)
                .ToListAsync();
        }

        public async Task<bool> DeleteOldNotificationsAsync(int daysOld = 30)
        {
            var cutoffDate = DateTime.Now.AddDays(-daysOld);

            var oldNotifications = await _context.Notifications
                .Where(n => n.CreatedAt < cutoffDate)
                .ToListAsync();

            _context.Notifications.RemoveRange(oldNotifications);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<Notification>> GetNotificationsByTypeAsync(int userId, string type)
        {
            return await _context.Notifications
                .Include(n => n.User)
                .Where(n => n.UserId == userId && n.Type == type)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }
    }
}