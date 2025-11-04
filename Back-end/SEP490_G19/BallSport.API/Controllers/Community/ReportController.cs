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
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        // GET: api/Report?pageNumber=1&pageSize=20&status=Pending&targetType=Post
        [HttpGet]
        [Authorize(Roles = "Admin")] // Chỉ Admin mới xem được tất cả báo cáo
        public async Task<IActionResult> GetAllReports(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] string? targetType = null)
        {
            try
            {
                var (reports, totalCount) = await _reportService.GetAllReportsAsync(
                    pageNumber,
                    pageSize,
                    status,
                    targetType
                );

                return Ok(new
                {
                    success = true,
                    data = reports,
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

        // GET: api/Report/5
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetReportById(int id)
        {
            try
            {
                var report = await _reportService.GetReportByIdAsync(id);

                if (report == null)
                    return NotFound(new { success = false, message = "Không tìm thấy báo cáo" });

                return Ok(new { success = true, data = report });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Report/my-reports
        [HttpGet("my-reports")]
        public async Task<IActionResult> GetMyReports()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var reports = await _reportService.GetReportsByReporterIdAsync(userId.Value);

                return Ok(new { success = true, data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Report/target?targetType=Post&targetId=5
        [HttpGet("target")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetReportsByTarget(
            [FromQuery] string targetType,
            [FromQuery] int targetId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(targetType) || (targetType != "Post" && targetType != "Comment"))
                {
                    return BadRequest(new { success = false, message = "TargetType phải là Post hoặc Comment" });
                }

                var reports = await _reportService.GetReportsByTargetAsync(targetType, targetId);

                return Ok(new { success = true, data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Report/pending?topCount=50
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingReports([FromQuery] int topCount = 50)
        {
            try
            {
                var reports = await _reportService.GetPendingReportsAsync(topCount);

                return Ok(new { success = true, data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Report/statistics?fromDate=2024-01-01&toDate=2024-12-31
        [HttpGet("statistics")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var stats = await _reportService.GetReportStatisticsAsync(fromDate, toDate);

                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Report/count?status=Pending
        [HttpGet("count")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CountReportsByStatus([FromQuery] string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                {
                    return BadRequest(new { success = false, message = "Status là bắt buộc" });
                }

                var count = await _reportService.CountReportsByStatusAsync(status);

                return Ok(new { success = true, data = new { status, count } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Report/target-count?targetType=Post&targetId=5
        [HttpGet("target-count")]
        public async Task<IActionResult> CountReportsByTarget(
            [FromQuery] string targetType,
            [FromQuery] int targetId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(targetType) || (targetType != "Post" && targetType != "Comment"))
                {
                    return BadRequest(new { success = false, message = "TargetType phải là Post hoặc Comment" });
                }

                var count = await _reportService.CountReportsByTargetAsync(targetType, targetId);

                return Ok(new { success = true, data = new { targetType, targetId, count } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // POST: api/Report
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDTO createReportDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                // Kiểm tra đã báo cáo chưa
                var hasReported = await _reportService.HasUserReportedAsync(
                    userId.Value,
                    createReportDto.TargetType,
                    createReportDto.TargetId
                );

                if (hasReported)
                {
                    return BadRequest(new { success = false, message = "Bạn đã báo cáo nội dung này rồi" });
                }

                var report = await _reportService.CreateReportAsync(createReportDto, userId.Value);

                return CreatedAtAction(nameof(GetReportById), new { id = report.ReportId }, new
                {
                    success = true,
                    message = "Gửi báo cáo thành công. Chúng tôi sẽ xem xét và xử lý",
                    data = report
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Report/5/handle
        [HttpPut("{id}/handle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HandleReport(int id, [FromBody] HandleReportDTO handleReportDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var adminId = GetCurrentUserId();
                if (adminId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var report = await _reportService.HandleReportAsync(id, handleReportDto, adminId.Value);

                if (report == null)
                    return NotFound(new { success = false, message = "Không tìm thấy báo cáo" });

                return Ok(new
                {
                    success = true,
                    message = $"Đã xử lý báo cáo: {handleReportDto.Status}",
                    data = report
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // DELETE: api/Report/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            try
            {
                var success = await _reportService.DeleteReportAsync(id);

                if (!success)
                    return NotFound(new { success = false, message = "Không tìm thấy báo cáo" });

                return Ok(new { success = true, message = "Xóa báo cáo thành công" });
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