// File: BallSport.API/Controllers/Community/NotificationController.cs
using BallSport.Application.DTOs.Community;
using BallSport.Application.Services.Community;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BallSport.API.Controllers.Community
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst("UserID") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out int id) ? id : null;
        }

        // ===================== USER ENDPOINTS =====================
        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] bool? isRead = null)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var result = await _notificationService.GetNotificationsByUserIdAsync(
                userId.Value, pageNumber, pageSize, isRead);

            return Ok(new
            {
                success = true,
                data = result.Notifications,
                pagination = new
                {
                    currentPage = pageNumber,
                    pageSize,
                    totalCount = result.TotalCount,
                    totalPages = (int)Math.Ceiling(result.TotalCount / (double)pageSize)
                }
            });
        }

        [HttpGet("latest")]
        public async Task<IActionResult> GetLatest([FromQuery] int topCount = 10)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var notifications = await _notificationService.GetLatestNotificationsAsync(userId.Value, topCount);
            return Ok(new { success = true, data = notifications });
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var count = await _notificationService.GetUnreadCountAsync(userId.Value);
            return Ok(new { success = true, data = new { unreadCount = count } });
        }

        [HttpGet("type/{type}")]
        public async Task<IActionResult> GetByType(string type)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var validTypes = new[] { "NewComment", "Reply", "Mention", "Like", "ReportResult", "MatchRequest", "MatchAccepted", "System" };
            if (!validTypes.Contains(type))
                return BadRequest(new { success = false, message = $"Type không hợp lệ. Chỉ chấp nhận: {string.Join(", ", validTypes)}" });

            var notifications = await _notificationService.GetNotificationsByTypeAsync(userId.Value, type);
            return Ok(new { success = true, data = notifications });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var success = await _notificationService.MarkAsReadAsync(id, userId.Value);
            return success
                ? Ok(new { success = true, message = "Đã đánh dấu đã đọc" })
                : NotFound(new { success = false, message = "Không tìm thấy hoặc không có quyền" });
        }

        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            await _notificationService.MarkAllAsReadAsync(userId.Value);
            return Ok(new { success = true, message = "Đã đánh dấu tất cả là đã đọc" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var success = await _notificationService.DeleteNotificationAsync(id, userId.Value);
            return success
                ? Ok(new { success = true, message = "Xóa thành công" })
                : NotFound(new { success = false, message = "Không tìm thấy hoặc không có quyền" });
        }

        [HttpDelete("delete-all")]
        public async Task<IActionResult> DeleteAll()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            await _notificationService.DeleteAllNotificationsAsync(userId.Value);
            return Ok(new { success = true, message = "Đã xóa toàn bộ thông báo" });
        }

        // ===================== ADMIN ENDPOINTS – SIÊU SẠCH, KHÔNG CÓ UPDATE =====================
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAdmin(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? type = null,
            [FromQuery] int? userId = null,
            [FromQuery] bool? isRead = null)
        {
            var result = await _notificationService.GetAllNotificationsAdminAsync(
                pageNumber, pageSize, search, type, userId, isRead);

            return Ok(new
            {
                success = true,
                data = result.Notifications,
                pagination = new
                {
                    currentPage = pageNumber,
                    pageSize,
                    totalCount = result.TotalCount,
                    totalPages = (int)Math.Ceiling(result.TotalCount / (double)pageSize)
                }
            });
        }

        [HttpGet("admin/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetOneAdmin(int id)
        {
            var noti = await _notificationService.GetNotificationByIdAdminAsync(id);
            return noti is null
                ? NotFound(new { success = false, message = "Không tìm thấy thông báo" })
                : Ok(new { success = true, data = noti });
        }

        // ADMIN: Tạo 1 thông báo
        [HttpPost("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateByAdmin([FromBody] CreateNotificationDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var created = await _notificationService.CreateNotificationAsync(dto);
            return CreatedAtAction(nameof(GetOneAdmin), new { id = created.NotificationId }, new
            {
                success = true,
                message = "Tạo thông báo thành công",
                data = created
            });
        }

        // ADMIN: Tạo hàng loạt
        [HttpPost("admin/bulk")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateBulkByAdmin([FromBody] IEnumerable<CreateNotificationDTO> dtos)
        {
            if (!ModelState.IsValid || dtos?.Any() != true)
                return BadRequest(new { success = false, message = "Danh sách thông báo không hợp lệ" });

            var success = await _notificationService.CreateBulkNotificationsAsync(dtos);
            return success
                ? Ok(new { success = true, message = $"Đã tạo thành công {dtos.Count()} thông báo" })
                : BadRequest(new { success = false, message = "Tạo thất bại" });
        }

        // ĐÃ BỎ HOÀN TOÀN ENDPOINT PUT (UPDATE) → MUỐN SỬA THÌ GỬI MỚI!

        // ADMIN: Xóa 1 thông báo bất kỳ
        [HttpDelete("admin/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAdmin(int id)
        {
            var success = await _notificationService.DeleteNotificationAdminAsync(id);
            return success
                ? Ok(new { success = true, message = "Xóa thành công" })
                : NotFound(new { success = false, message = "Không tìm thấy thông báo" });
        }

        // ADMIN: Xóa nhiều cùng lúc
        [HttpDelete("admin/bulk")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBulkAdmin([FromBody] List<int> ids)
        {
            if (ids == null || ids.Count == 0)
                return BadRequest(new { success = false, message = "Danh sách ID rỗng" });

            var deletedCount = await _notificationService.DeleteMultipleNotificationsAdminAsync(ids);
            return Ok(new { success = true, message = $"Đã xóa {deletedCount} thông báo" });
        }
    }
}