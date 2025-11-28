// File: BallSport.API/Controllers/MatchFinding/MatchRequestController.cs
using BallSport.Application.DTOs.MatchFinding;
using BallSport.Application.Services.MatchFinding;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BallSport.API.Controllers.MatchFinding
{
    [ApiController]
    [Route("api/match-requests")]
    [Authorize] // Tất cả cần login, trừ những endpoint có [AllowAnonymous]
    [Produces("application/json")]
    public class MatchRequestController : ControllerBase
    {
        private readonly IMatchFindingService _service;

        public MatchRequestController(IMatchFindingService service)
        {
            _service = service;
        }

        private int CurrentUserId =>
            int.TryParse(User.FindFirst("UserID")?.Value ??
                        User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id)
                ? id
                : throw new UnauthorizedAccessException("Không tìm thấy UserID trong token");

        // 1. LẤY DANH SÁCH KÈO ĐANG MỞ (Public + loại bỏ kèo của mình nếu đã login)
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveRequests(
            [FromQuery] int page = 1,
            [FromQuery] int size = 10)
        {
            var userId = User.Identity?.IsAuthenticated == true ? CurrentUserId : (int?)null;
            var result = await _service.GetActiveRequestsAsync(page, size, userId);

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách kèo thành công",
                data = result.Content,
                pagination = new
                {
                    page = result.PageNumber,
                    size = result.PageSize,
                    total = result.TotalElements,
                    totalPages = result.TotalPages,
                    hasNext = result.HasNext,
                    hasPrevious = result.HasPrevious
                }
            });
        }

        // 2. XEM CHI TIẾT KÈO (Public)
        [HttpGet("{requestId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDetail(int requestId)
        {
            var userId = User.Identity?.IsAuthenticated == true ? CurrentUserId : 0;
            var detail = await _service.GetRequestDetailAsync(requestId, userId);

            return detail is null
                ? NotFound(new { success = false, message = "Không tìm thấy kèo này" })
                : Ok(new { success = true, message = "Lấy chi tiết kèo thành công", data = detail });
        }

        // 3. TẠO KÈO TÌM ĐỐI THỦ
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateMatchRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            try
            {
                var requestId = await _service.CreateRequestAsync(dto, CurrentUserId);
                return Created($"/api/match-requests/{requestId}", new
                {
                    success = true,
                    message = "Tạo kèo thành công! Chờ đối thủ tham gia nào!",
                    data = new { matchRequestId = requestId }
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        // 4. THAM GIA KÈO
        [HttpPost("{requestId:int}/join")]
        public async Task<IActionResult> JoinRequest(int requestId, [FromBody] JoinMatchRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            try
            {
                await _service.JoinRequestAsync(requestId, dto, CurrentUserId);
                return Ok(new
                {
                    success = true,
                    message = "Đã gửi yêu cầu tham gia! Vui lòng chờ chủ sân duyệt nhé!"
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kèo này" });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { success = false, message = ex.Message });
            }
        }

        // 5. CHẤP NHẬN ĐỘI → GHÉP THÀNH CÔNG
        [HttpPost("{requestId:int}/accept/{participantId:int}")]
        public async Task<IActionResult> AcceptParticipant(int requestId, int participantId)
        {
            try
            {
                var result = await _service.AcceptParticipantAsync(requestId, participantId, CurrentUserId);
                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    data = result.Data
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kèo hoặc đội tham gia" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Chỉ chủ sân mới được chấp nhận đội");
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { success = false, message = ex.Message });
            }
        }

        // 6. TỪ CHỐI / RÚT LUI
        [HttpPost("{requestId:int}/reject-or-withdraw/{participantId:int}")]
        public async Task<IActionResult> RejectOrWithdraw(int requestId, int participantId)
        {
            try
            {
                await _service.RejectOrWithdrawAsync(requestId, participantId, CurrentUserId);
                return Ok(new { success = true, message = "Đã xử lý yêu cầu thành công" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kèo hoặc người chơi" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Bạn không có quyền thực hiện hành động này");
            }
        }

        // 7. HỦY KÈO
        [HttpDelete("{requestId:int}")]
        public async Task<IActionResult> CancelRequest(int requestId)
        {
            try
            {
                await _service.CancelRequestAsync(requestId, CurrentUserId);
                return Ok(new { success = true, message = "Đã hủy kèo thành công" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kèo" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Chỉ chủ sân mới được hủy kèo");
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { success = false, message = ex.Message });
            }
        }

        // 8. LỊCH SỬ CỦA TÔI
        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyHistory(
            [FromQuery] int page = 1,
            [FromQuery] int size = 10)
        {
            var result = await _service.GetMyHistoryAsync(CurrentUserId, page, size);

            return Ok(new
            {
                success = true,
                message = "Lấy lịch sử ghép đội thành công",
                data = result.Content,
                pagination = new
                {
                    page = result.PageNumber,
                    size = result.PageSize,
                    total = result.TotalElements,
                    totalPages = result.TotalPages,
                    hasNext = result.HasNext,
                    hasPrevious = result.HasPrevious
                }
            });
        }

        // 9. KIỂM TRA BOOKING ĐÃ CÓ KÈO CHƯA
        [HttpGet("booking/{bookingId:int}/has-request")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckBookingHasRequest(int bookingId)
        {
            var (hasRequest, matchRequestId) = await _service.GetBookingRequestInfoAsync(bookingId);

            return Ok(new
            {
                success = true,
                message = hasRequest ? "Booking đã có kèo tìm đối thủ" : "Booking chưa có kèo",
                data = new
                {
                    bookingId,
                    hasRequest,
                    matchRequestId  // ← MỚI: có cũng trả, không có thì null
                }
            });
        }

        // 10. DỌN KÈO QUÁ HẠN (Admin hoặc Hangfire)
        [HttpPost("expire-old")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ExpireOldRequests()
        {
            var count = await _service.ExpireOldRequestsAsync();
            return Ok(new
            {
                success = true,
                message = $"Đã dọn thành công {count} kèo quá hạn",
                data = new { expiredCount = count, executedAt = DateTime.UtcNow }
            });
        }
    }
}