﻿using BallSport.Application.DTOs.Community;
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
            _notificationService = notificationService;
        }

        // GET: api/Notification?pageNumber=1&pageSize=20&isRead=false
        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] bool? isRead = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var (notifications, totalCount) = await _notificationService.GetNotificationsByUserIdAsync(
                    userId.Value,
                    pageNumber,
                    pageSize,
                    isRead
                );

                return Ok(new
                {
                    success = true,
                    data = notifications,
                    pagination = new
                    {
                        currentPage = pageNumber,
                        pageSize = pageSize,
                        totalCount = totalCount,
                        totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Notification/latest?topCount=10
        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestNotifications([FromQuery] int topCount = 10)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var notifications = await _notificationService.GetLatestNotificationsAsync(userId.Value, topCount);

                return Ok(new { success = true, data = notifications });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Notification/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var count = await _notificationService.GetUnreadCountAsync(userId.Value);

                return Ok(new { success = true, data = new { unreadCount = count } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Notification/type/Like
        [HttpGet("type/{type}")]
        public async Task<IActionResult> GetNotificationsByType(string type)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var validTypes = new[] { "NewComment", "Reply", "Mention", "Like", "ReportResult", "System" };
                if (!validTypes.Contains(type))
                {
                    return BadRequest(new { success = false, message = $"Type phải là một trong: {string.Join(", ", validTypes)}" });
                }

                var notifications = await _notificationService.GetNotificationsByTypeAsync(userId.Value, type);

                return Ok(new { success = true, data = notifications });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // POST: api/Notification
        [HttpPost]
        [Authorize(Roles = "Admin")] // Chỉ Admin mới có quyền tạo thông báo thủ công
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDTO createNotificationDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var notification = await _notificationService.CreateNotificationAsync(createNotificationDto);

                return CreatedAtAction(nameof(GetNotifications), null, new
                {
                    success = true,
                    message = "Tạo thông báo thành công",
                    data = notification
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // POST: api/Notification/bulk
        [HttpPost("bulk")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateBulkNotifications([FromBody] IEnumerable<CreateNotificationDTO> notificationDtos)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var success = await _notificationService.CreateBulkNotificationsAsync(notificationDtos);

                if (!success)
                    return BadRequest(new { success = false, message = "Không thể tạo thông báo" });

                return Ok(new { success = true, message = $"Đã tạo {notificationDtos.Count()} thông báo" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // PUT: api/Notification/5/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _notificationService.MarkAsReadAsync(id, userId.Value);

                if (!success)
                    return NotFound(new { success = false, message = "Không tìm thấy thông báo hoặc bạn không có quyền" });

                return Ok(new { success = true, message = "Đã đánh dấu đã đọc" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // PUT: api/Notification/mark-all-read
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _notificationService.MarkAllAsReadAsync(userId.Value);

                if (!success)
                    return BadRequest(new { success = false, message = "Không thể đánh dấu tất cả là đã đọc" });

                return Ok(new { success = true, message = "Đã đánh dấu tất cả thông báo là đã đọc" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // DELETE: api/Notification/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _notificationService.DeleteNotificationAsync(id, userId.Value);

                if (!success)
                    return NotFound(new { success = false, message = "Không tìm thấy thông báo hoặc bạn không có quyền xóa" });

                return Ok(new { success = true, message = "Xóa thông báo thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // DELETE: api/Notification/delete-all
        [HttpDelete("delete-all")]
        public async Task<IActionResult> DeleteAllNotifications()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _notificationService.DeleteAllNotificationsAsync(userId.Value);

                if (!success)
                    return BadRequest(new { success = false, message = "Không thể xóa thông báo" });

                return Ok(new { success = true, message = "Đã xóa tất cả thông báo" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // Helper method
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }
    }
}