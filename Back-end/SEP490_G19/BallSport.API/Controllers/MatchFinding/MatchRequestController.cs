

using BallSport.Application.DTOs.MatchFinding;
using BallSport.Application.Services.MatchFinding;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BallSport.API.Controllers.MatchFinding
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MatchRequestController : ControllerBase
    {
        private readonly IMatchRequestService _matchRequestService;

        public MatchRequestController(IMatchRequestService matchRequestService)
        {
            _matchRequestService = matchRequestService;
        }

        // GET: api/MatchRequest?pageNumber=1&pageSize=10&status=Open
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllMatchRequests(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = "Open",
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? fieldId = null)
        {
            try
            {
                var filter = new MatchFilterDTO
                {
                    Status = status,
                    FromDate = fromDate,
                    ToDate = toDate,
                    FieldId = fieldId
                };

                var (requests, totalCount) = await _matchRequestService.GetAllMatchRequestsAsync(
                    pageNumber,
                    pageSize,
                    filter
                );

                return Ok(new
                {
                    success = true,
                    data = requests,
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

        // GET: api/MatchRequest/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMatchRequestDetail(int id)
        {
            try
            {
                var request = await _matchRequestService.GetMatchRequestDetailAsync(id);

                if (request == null)
                    return NotFound(new { success = false, message = "Không tìm thấy yêu cầu tìm đối thủ" });

                return Ok(new { success = true, data = request });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/MatchRequest/my-matches
        [HttpGet("my-matches")]
        public async Task<IActionResult> GetMyMatches()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var matches = await _matchRequestService.GetMyMatchesAsync(userId.Value);

                return Ok(new { success = true, data = matches });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/MatchRequest/my-requests
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyMatchRequests()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var requests = await _matchRequestService.GetMyMatchRequestsAsync(userId.Value);

                return Ok(new { success = true, data = requests });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/MatchRequest/statistics
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var userId = GetCurrentUserId();
                var stats = await _matchRequestService.GetMatchStatisticsAsync(userId);

                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/MatchRequest/booking/5/has-request
        [HttpGet("booking/{bookingId}/has-request")]
        public async Task<IActionResult> CheckBookingHasRequest(int bookingId)
        {
            try
            {
                var hasRequest = await _matchRequestService.BookingHasMatchRequestAsync(bookingId);

                return Ok(new { success = true, data = new { hasRequest } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // POST: api/MatchRequest
        [HttpPost]
        public async Task<IActionResult> CreateMatchRequest([FromBody] CreateMatchRequestDTO createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var request = await _matchRequestService.CreateMatchRequestAsync(createDto, userId.Value);

                return CreatedAtAction(nameof(GetMatchRequestDetail), new { id = request.MatchRequestId }, new
                {
                    success = true,
                    message = "Tạo yêu cầu tìm đối thủ thành công",
                    data = request
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/MatchRequest/join
        [HttpPost("join")]
        public async Task<IActionResult> JoinMatch([FromBody] JoinMatchRequestDTO joinDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var participant = await _matchRequestService.JoinMatchAsync(joinDto, userId.Value);

                return Ok(new
                {
                    success = true,
                    message = "Gửi yêu cầu tham gia thành công. Vui lòng chờ chủ sân xác nhận",
                    data = participant
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/MatchRequest/5/respond
        [HttpPut("{id}/respond")]
        public async Task<IActionResult> RespondToJoinRequest(int id, [FromBody] RespondMatchRequestDTO respondDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var request = await _matchRequestService.RespondToJoinRequestAsync(id, respondDto, userId.Value);

                if (request == null)
                    return NotFound(new { success = false, message = "Không tìm thấy yêu cầu" });

                var message = respondDto.Action == "Accept"
                    ? "Đã chấp nhận đội tham gia"
                    : "Đã từ chối đội tham gia";

                return Ok(new
                {
                    success = true,
                    message = message,
                    data = request
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/MatchRequest/5/cancel
        [HttpDelete("{id}/cancel")]
        public async Task<IActionResult> CancelMatchRequest(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _matchRequestService.CancelMatchRequestAsync(id, userId.Value);

                if (!success)
                    return NotFound(new { success = false, message = "Không tìm thấy yêu cầu hoặc bạn không có quyền hủy" });

                return Ok(new { success = true, message = "Đã hủy yêu cầu tìm đối thủ" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/MatchRequest/auto-expire
        [HttpPost("auto-expire")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AutoExpireRequests([FromQuery] int hoursToExpire = 1)
        {
            try
            {
                var expiredCount = await _matchRequestService.AutoExpireMatchRequestsAsync(hoursToExpire);

                return Ok(new
                {
                    success = true,
                    message = $"Đã expire {expiredCount} yêu cầu",
                    data = new { expiredCount }
                });
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