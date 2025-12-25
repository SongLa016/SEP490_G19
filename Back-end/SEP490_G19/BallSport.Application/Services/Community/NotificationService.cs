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
        private const string SYSTEM_TYPE = "System";

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
        public async Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)>
            GetNotificationsByUserIdAsync(int userId, int pageNumber = 1, int pageSize = 20, bool? isRead = null)
        {
            var (notifications, totalCount) =
                await _notificationRepository.GetNotificationsByUserIdAsync(userId, pageNumber, pageSize, isRead);
            return (MapToNotificationDTOs(notifications), totalCount);
        }

        public async Task<IEnumerable<NotificationDTO>> GetLatestNotificationsAsync(int userId, int topCount = 10)
            => MapToNotificationDTOs(await _notificationRepository.GetLatestNotificationsAsync(userId, topCount));

        public async Task<NotificationDTO> CreateNotificationAsync(CreateNotificationDTO dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            // Không phải System → bắt buộc UserId
            if (!dto.UserId.HasValue && dto.Type != SYSTEM_TYPE)
                throw new ArgumentException("UserId là bắt buộc khi không phải thông báo hệ thống.");

            // Chặn gửi System bằng API thường
            if (dto.Type == SYSTEM_TYPE && dto.UserId == null)
            {
                throw new InvalidOperationException(
                    "Không thể gửi thông báo hệ thống bằng API này. Vui lòng dùng POST /admin/bulk.");
            }

            var notification = new Notification
            {
                UserId = dto.UserId!.Value,
                Type = dto.Type,
                TargetId = dto.TargetId ?? 0,
                Message = BuildFullMessage(dto.Title, dto.Message),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            var created = await _notificationRepository.CreateNotificationAsync(notification);
            return MapToNotificationDTO(created);
        }

        public async Task<int> CreateBulkNotificationsAsync(IEnumerable<CreateNotificationDTO> dtos)
        {
            if (dtos == null || !dtos.Any())
                return 0;

            var notificationsToCreate = new List<Notification>();
            int totalExpected = 0;

            foreach (var dto in dtos)
            {
                var finalMessage = BuildFullMessage(dto.Title, dto.Message);

                // ===== SYSTEM NOTIFICATION (ADMIN) =====
                if (dto.Type == SYSTEM_TYPE && dto.UserId == null)
                {
                    var adminRoleId = await _context.Roles
                        .Where(r => r.RoleName == "Admin")
                        .Select(r => r.RoleId)
                        .FirstOrDefaultAsync();

                    var userIds = await _context.Users
                        .Where(u => adminRoleId == 0 || !u.UserRoles.Any(ur => ur.RoleId == adminRoleId))
                        .Select(u => u.UserId)
                        .ToListAsync();

                    foreach (var userId in userIds)
                    {
                        notificationsToCreate.Add(new Notification
                        {
                            UserId = userId,
                            Type = SYSTEM_TYPE,
                            Message = finalMessage,
                            TargetId = dto.TargetId ?? 0,
                            CreatedAt = DateTime.UtcNow,
                            IsRead = false
                        });
                    }
                    totalExpected += userIds.Count;
                }
                // ===== PERSONAL NOTIFICATION =====
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

            if (!notificationsToCreate.Any())
                return 0;

            var inserted = await _notificationRepository.CreateNotificationsAsync(notificationsToCreate);
            _logger.LogInformation("Bulk insert completed: {Inserted}/{Expected}", inserted, totalExpected);
            return inserted;
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

        public Task<int> CleanupOldNotificationsAsync(int daysOld = 30)
            => _notificationRepository.DeleteOldNotificationsAsync(daysOld);

        // ===================== ADMIN METHODS =====================
        public async Task<(IEnumerable<NotificationDTO> Notifications, int TotalCount)>
            GetAllNotificationsAdminAsync(
                int pageNumber = 1,
                int pageSize = 20,
                string? search = null,
                string? type = null,
                int? userId = null,
                bool? isRead = null)
        {
            var (notifications, totalCount) =
                await _notificationRepository.GetAllNotificationsAdminAsync(
                    pageNumber, pageSize, search, SYSTEM_TYPE, null, isRead);

            return (MapToNotificationDTOs(notifications), totalCount);
        }

        public async Task<NotificationDTO?> GetNotificationByIdAdminAsync(int notificationId)
        {
            var noti = await _notificationRepository.GetNotificationByIdAdminAsync(notificationId);
            if (noti == null || noti.Type != SYSTEM_TYPE)
                return null;
            return MapToNotificationDTO(noti);
        }

        public async Task<bool> DeleteNotificationAdminAsync(int notificationId)
        {
            var noti = await _notificationRepository.GetNotificationByIdAdminAsync(notificationId);
            if (noti == null || noti.Type != SYSTEM_TYPE)
                return false;
            return await _notificationRepository.DeleteNotificationAdminAsync(notificationId);
        }

        public async Task<int> DeleteMultipleNotificationsAdminAsync(IEnumerable<int> notificationIds)
        {
            if (notificationIds == null || !notificationIds.Any())
                return 0;

            var systemIds = await _context.Notifications
                .Where(n => notificationIds.Contains(n.NotificationId) && n.Type == SYSTEM_TYPE)
                .Select(n => n.NotificationId)
                .ToListAsync();

            if (!systemIds.Any())
                return 0;

            return await _notificationRepository.DeleteMultipleNotificationsAdminAsync(systemIds);
        }

        // ===================== PRIVATE HELPERS =====================
        private static string BuildFullMessage(string? title, string? message)
        {
            if (string.IsNullOrWhiteSpace(title))
                return message ?? "Bạn có thông báo mới";
            if (string.IsNullOrWhiteSpace(message))
                return $"[{title}]";
            return $"[{title}] {message}";
        }

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