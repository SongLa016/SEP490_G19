// File: BallSport.Application/Services/Community/NotificationService.cs
using BallSport.Application.DTOs.Community;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.Community;

namespace BallSport.Application.Services.Community
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository ?? throw new ArgumentNullException(nameof(notificationRepository));
        }

        // ===================== USER METHODS =====================
        public async Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId, int pageNumber, int pageSize, bool? isRead = null)
        {
            var (notifications, totalCount) = await _notificationRepository.GetNotificationsByUserIdAsync(
                userId, pageNumber, pageSize, isRead);

            return (MapToNotificationDTOs(notifications), totalCount);
        }

        public async Task<IEnumerable<NotificationDTO>> GetLatestNotificationsAsync(int userId, int topCount = 10)
            => MapToNotificationDTOs(await _notificationRepository.GetLatestNotificationsAsync(userId, topCount));

        public async Task<NotificationDTO> CreateNotificationAsync(CreateNotificationDTO dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var notification = new Notification
            {
                UserId = dto.UserId,
                Type = dto.Type ?? "Info",
                TargetId = dto.TargetId,
                Message = dto.Message ?? "Bạn có thông báo mới",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            var created = await _notificationRepository.CreateNotificationAsync(notification);
            return MapToNotificationDTO(created);
        }

        public async Task<bool> CreateBulkNotificationsAsync(IEnumerable<CreateNotificationDTO> dtos)
        {
            if (dtos?.Any() != true) return true;

            var notifications = dtos.Select(dto => new Notification
            {
                UserId = dto.UserId,
                Type = dto.Type ?? "Info",
                TargetId = dto.TargetId,
                Message = dto.Message ?? "Bạn có thông báo mới",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            }).ToList();

            return await _notificationRepository.CreateNotificationsAsync(notifications);
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            var noti = await _notificationRepository.GetNotificationByIdAsync(notificationId);
            return noti?.UserId == userId && await _notificationRepository.MarkAsReadAsync(notificationId);
        }

        public Task<bool> MarkAllAsReadAsync(int userId)
            => _notificationRepository.MarkAllAsReadAsync(userId);

        public async Task<bool> DeleteNotificationAsync(int notificationId, int userId)
        {
            var noti = await _notificationRepository.GetNotificationByIdAsync(notificationId);
            if (noti == null || noti.UserId != userId) return false;

            return await _notificationRepository.DeleteNotificationAsync(notificationId);
        }

        public Task<bool> DeleteAllNotificationsAsync(int userId)
            => _notificationRepository.DeleteAllNotificationsAsync(userId);

        public Task<int> GetUnreadCountAsync(int userId)
            => _notificationRepository.CountUnreadNotificationsAsync(userId);

        public async Task<IEnumerable<NotificationDTO>> GetNotificationsByTypeAsync(int userId, string type)
            => MapToNotificationDTOs(await _notificationRepository.GetNotificationsByTypeAsync(userId, type));

        public Task<bool> CleanupOldNotificationsAsync(int daysOld = 30)
            => _notificationRepository.DeleteOldNotificationsAsync(daysOld);

        // ===================== ADMIN METHODS – SIÊU SẠCH, KHÔNG CÓ UPDATE =====================
        public async Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetAllNotificationsAdminAsync(
            int pageNumber = 1,
            int pageSize = 20,
            string? search = null,
            string? type = null,
            int? userId = null,
            bool? isRead = null)
        {
            var (notifications, totalCount) = await _notificationRepository.GetAllNotificationsAdminAsync(
                pageNumber, pageSize, search, type, userId, isRead);

            return (MapToNotificationDTOs(notifications), totalCount);
        }

        public async Task<NotificationDTO?> GetNotificationByIdAdminAsync(int notificationId)
        {
            var noti = await _notificationRepository.GetNotificationByIdAdminAsync(notificationId);
            return noti is null ? null : MapToNotificationDTO(noti);
        }

        public Task<bool> DeleteNotificationAdminAsync(int notificationId)
            => _notificationRepository.DeleteNotificationAdminAsync(notificationId);

        public Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds)
            => notificationIds?.Any() == true
                ? _notificationRepository.DeleteMultipleNotificationsAdminAsync(notificationIds)
                : Task.FromResult(0);

        // ===================== HELPER MAPPING – AN TOÀN 100% VỚI NULL =====================
        private NotificationDTO MapToNotificationDTO(Notification n) => new()
        {
            NotificationId = n.NotificationId,
            UserId = n.UserId,
            Type = n.Type ?? "Info",
            TargetId = n.TargetId,
            Message = n.Message ?? "[Nội dung đã bị xóa]",
            IsRead = n.IsRead ?? false,
            CreatedAt = n.CreatedAt ?? DateTime.UtcNow
        };

        private IEnumerable<NotificationDTO> MapToNotificationDTOs(IEnumerable<Notification> source)
            => (source ?? Enumerable.Empty<Notification>()).Select(MapToNotificationDTO);
    }
}