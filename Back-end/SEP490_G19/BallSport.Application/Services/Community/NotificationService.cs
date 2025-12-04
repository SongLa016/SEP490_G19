// File: BallSport.Application/Services/Community/NotificationService.cs
using BallSport.Application.DTOs.Community;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BallSport.Application.Services.Community
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly Sep490G19v1Context _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            INotificationRepository notificationRepository,
            Sep490G19v1Context context,
            ILogger<NotificationService> logger)
        {
            _notificationRepository = notificationRepository ?? throw new ArgumentNullException(nameof(notificationRepository));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // ===================== USER METHODS =====================
        public async Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetNotificationsByUserIdAsync(
            int userId, int pageNumber = 1, int pageSize = 20, bool? isRead = null)
        {
            var (notifications, totalCount) = await _notificationRepository.GetNotificationsByUserIdAsync(userId, pageNumber, pageSize, isRead);
            return (MapToNotificationDTOs(notifications), totalCount);
        }

        public async Task<IEnumerable<NotificationDTO>> GetLatestNotificationsAsync(int userId, int topCount = 10)
            => MapToNotificationDTOs(await _notificationRepository.GetLatestNotificationsAsync(userId, topCount));

        public async Task<NotificationDTO> CreateNotificationAsync(CreateNotificationDTO dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (!dto.UserId.HasValue)
                throw new ArgumentException("UserId là bắt buộc khi tạo thông báo cá nhân.");

            var finalMessage = BuildFullMessage(dto.Title, dto.Message);

            var notification = new Notification
            {
                UserId = dto.UserId.Value,
                Type = dto.Type,
                TargetId = dto.TargetId ?? 0,
                Message = finalMessage,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            var created = await _notificationRepository.CreateNotificationAsync(notification);
            return MapToNotificationDTO(created);
        }

        public async Task<int> CreateBulkNotificationsAsync(IEnumerable<CreateNotificationDTO> dtos)
        {
            if (dtos == null || !dtos.Any()) return 0;

            var notificationsToCreate = new List<Notification>();
            int totalExpected = 0;

            foreach (var dto in dtos)
            {
                var finalMessage = BuildFullMessage(dto.Title, dto.Message);

                // GỬI TOÀN HỆ THỐNG (System + UserId = null)
                if (dto.Type == "System" && dto.UserId == null)
                {
                    var allUserIds = await _context.Users
                        .Select(u => u.UserId)
                        .ToListAsync();

                    foreach (var userId in allUserIds)
                    {
                        notificationsToCreate.Add(new Notification
                        {
                            UserId = userId,
                            Type = "System",
                            Message = finalMessage,
                            TargetId = dto.TargetId ?? 0,
                            CreatedAt = DateTime.UtcNow,
                            IsRead = false
                        });
                    }
                    totalExpected += allUserIds.Count;
                    _logger.LogInformation("System notification prepared for {Count} users.", allUserIds.Count);
                }
                // GỬI CÁ NHÂN
                else
                {
                    if (!dto.UserId.HasValue)
                        throw new ArgumentException("UserId là bắt buộc khi không phải thông báo hệ thống.");

                    notificationsToCreate.Add(new Notification
                    {
                        UserId = dto.UserId.Value,
                        Type = dto.Type,
                        Message = finalMessage,
                        TargetId = dto.TargetId ?? 0,
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    });
                    totalExpected++;
                }
            }

            if (notificationsToCreate.Any())
            {
                var inserted = await _notificationRepository.CreateNotificationsAsync(notificationsToCreate);
                _logger.LogInformation("Bulk insert completed: {Inserted}/{Expected}", inserted, totalExpected);
                return inserted;
            }

            return totalExpected;
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
            return noti?.UserId == userId && await _notificationRepository.DeleteNotificationAsync(notificationId);
        }

        public Task<bool> DeleteAllNotificationsAsync(int userId)
            => _notificationRepository.DeleteAllNotificationsAsync(userId);

        public Task<int> GetUnreadCountAsync(int userId)
            => _notificationRepository.CountUnreadNotificationsAsync(userId);

        public async Task<IEnumerable<NotificationDTO>> GetNotificationsByTypeAsync(int userId, string type)
            => MapToNotificationDTOs(await _notificationRepository.GetNotificationsByTypeAsync(userId, type));

        public async Task<int> CleanupOldNotificationsAsync(int daysOld = 30)
            => await _notificationRepository.DeleteOldNotificationsAsync(daysOld);

        // ===================== ADMIN METHODS =====================
        public async Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)> GetAllNotificationsAdminAsync(
            int pageNumber = 1, int pageSize = 20,
            string? search = null, string? type = null, int? userId = null, bool? isRead = null)
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

        public async Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds)
        {
            if (notificationIds == null || !notificationIds.Any())
                return 0;

            return await _notificationRepository.DeleteMultipleNotificationsAdminAsync(notificationIds);
        }

        // ===================== PRIVATE HELPER =====================
        /// <summary>
        /// Gộp Title + Message thành 1 chuỗi đẹp để lưu vào DB
        /// Ví dụ: [CẢNH CÁO] Bạn đã hủy sân quá nhiều lần!
        /// </summary>
        private static string BuildFullMessage(string? title, string? message)
        {
            if (string.IsNullOrWhiteSpace(title))
                return message ?? "Bạn có thông báo mới";

            if (string.IsNullOrWhiteSpace(message))
                return $"[{title}]";

            return $"[{title}] {message}";
        }

        // ===================== MAPPING =====================
        private static NotificationDTO MapToNotificationDTO(Notification n) => new()
        {
            NotificationId = n.NotificationId,
            UserId = n.UserId,
            Type = n.Type ?? "Info",
            Message = n.Message ?? "Thông báo",
            TargetId = n.TargetId,
            IsRead = n.IsRead ?? false,
            CreatedAt = n.CreatedAt ?? DateTime.UtcNow
        };

        private static IEnumerable<NotificationDTO> MapToNotificationDTOs(IEnumerable<Notification> source)
            => source?.Select(MapToNotificationDTO) ?? Enumerable.Empty<NotificationDTO>();
    }
}