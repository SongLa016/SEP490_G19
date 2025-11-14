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
            _notificationRepository = notificationRepository;
        }

        public async Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId,
            int pageNumber,
            int pageSize,
            bool? isRead = null)
        {
            var (notifications, totalCount) = await _notificationRepository.GetNotificationsByUserIdAsync(
                userId,
                pageNumber,
                pageSize,
                isRead
            );

            var notificationDtos = MapToNotificationDTOs(notifications);

            return (notificationDtos, totalCount);
        }

        public async Task<IEnumerable<NotificationDTO>> GetLatestNotificationsAsync(int userId, int topCount = 10)
        {
            var notifications = await _notificationRepository.GetLatestNotificationsAsync(userId, topCount);
            return MapToNotificationDTOs(notifications);
        }

        public async Task<NotificationDTO> CreateNotificationAsync(CreateNotificationDTO createNotificationDto)
        {
            var notification = new Notification
            {
                UserId = createNotificationDto.UserId,
                Type = createNotificationDto.Type,
                TargetId = createNotificationDto.TargetId,
                Message = createNotificationDto.Message
            };

            var createdNotification = await _notificationRepository.CreateNotificationAsync(notification);
            return MapToNotificationDTO(createdNotification);
        }

        public async Task<bool> CreateBulkNotificationsAsync(IEnumerable<CreateNotificationDTO> notificationDtos)
        {
            var notifications = notificationDtos.Select(dto => new Notification
            {
                UserId = dto.UserId,
                Type = dto.Type,
                TargetId = dto.TargetId,
                Message = dto.Message
            }).ToList();

            return await _notificationRepository.CreateNotificationsAsync(notifications);
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            // Kiểm tra notification có thuộc về user không
            var notification = await _notificationRepository.GetNotificationByIdAsync(notificationId);
            if (notification == null || notification.UserId != userId)
                return false;

            return await _notificationRepository.MarkAsReadAsync(notificationId);
        }

        public async Task<bool> MarkAllAsReadAsync(int userId)
        {
            return await _notificationRepository.MarkAllAsReadAsync(userId);
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId, int userId)
        {
            // Kiểm tra notification có thuộc về user không
            var notification = await _notificationRepository.GetNotificationByIdAsync(notificationId);
            if (notification == null || notification.UserId != userId)
                return false;

            return await _notificationRepository.DeleteNotificationAsync(notificationId);
        }

        public async Task<bool> DeleteAllNotificationsAsync(int userId)
        {
            return await _notificationRepository.DeleteAllNotificationsAsync(userId);
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _notificationRepository.CountUnreadNotificationsAsync(userId);
        }

        public async Task<IEnumerable<NotificationDTO>> GetNotificationsByTypeAsync(int userId, string type)
        {
            var notifications = await _notificationRepository.GetNotificationsByTypeAsync(userId, type);
            return MapToNotificationDTOs(notifications);
        }

        public async Task<bool> CleanupOldNotificationsAsync(int daysOld = 30)
        {
            return await _notificationRepository.DeleteOldNotificationsAsync(daysOld);
        }

        // Helper methods
        private NotificationDTO MapToNotificationDTO(Notification notification)
        {
            return new NotificationDTO
            {
                NotificationId = notification.NotificationId,
                UserId = notification.UserId,
                Type = notification.Type,
                TargetId = notification.TargetId,
                Message = notification.Message,
                IsRead = notification.IsRead ?? false,
                CreatedAt = notification.CreatedAt
            };
        }

        private IEnumerable<NotificationDTO> MapToNotificationDTOs(IEnumerable<Notification> notifications)
        {
            return notifications.Select(MapToNotificationDTO).ToList();
        }
    }
}