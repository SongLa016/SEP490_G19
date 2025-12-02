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

        // GET: api/Report (Admin only) - Danh sách báo cáo + phân trang
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllReports(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] string? targetType = null)
        {
            var (reports, totalCount) = await _reportService.GetAllReportsAsync(pageNumber, pageSize, status, targetType);

            return Ok(new
            {
                success = true,
                data = reports,
                pagination = new
                {
                    pageNumber,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }

        // GET: api/Report/{id} (Admin only)
        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetReportById(int id)
        {
            var report = await _reportService.GetReportByIdAsync(id);
            return report == null
                ? NotFound(new { success = false, message = "Không tìm thấy báo cáo" })
                : Ok(new { success = true, data = report });
        }

        // GET: api/Report/my-reports - Người dùng xem báo cáo của mình
        [HttpGet("my-reports")]
        public async Task<IActionResult> GetMyReports()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var reports = await _reportService.GetReportsByReporterIdAsync(userId.Value);
            return Ok(new { success = true, data = reports });
        }

        // GET: api/Report/pending (Admin only) - Báo cáo đang chờ xử lý
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingReports([FromQuery] int topCount = 50)
        {
            var reports = await _reportService.GetPendingReportsAsync(topCount);
            return Ok(new { success = true, data = reports });
        }

        // GET: api/Report/statistics (Admin only)
        [HttpGet("statistics")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStatistics([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            var stats = await _reportService.GetReportStatisticsAsync(fromDate, toDate);
            return Ok(new { success = true, data = stats });
        }

        // POST: api/Report - Người dùng gửi báo cáo
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var report = await _reportService.CreateReportAsync(dto, userId.Value);
            return CreatedAtAction(nameof(GetReportById), new { id = report.ReportId }, new
            {
                success = true,
                message = "Gửi báo cáo thành công! Chúng tôi sẽ xem xét sớm nhất.",
                data = report
            });
        }

        // PUT: api/Report/{id}/handle (Admin only) - Xử lý báo cáo
        [HttpPut("{id:int}/handle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HandleReport(int id, [FromBody] HandleReportDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var adminId = GetCurrentUserId()!.Value;
            var report = await _reportService.HandleReportAsync(id, dto, adminId);

            if (report == null)
                return NotFound(new { success = false, message = "Không tìm thấy báo cáo" });

            return Ok(new
            {
                success = true,
                message = dto.Status == "Resolved"
                    ? "Đã xóa nội dung vi phạm thành công!"
                    : "Đã từ chối báo cáo.",
                data = report
            });
        }

        // DELETE: api/Report/{id} (Admin only)
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            var success = await _reportService.DeleteReportAsync(id);
            return success
                ? Ok(new { success = true, message = "Xóa báo cáo thành công" })
                : NotFound(new { success = false, message = "Không tìm thấy báo cáo" });
        }

        // Helper: Lấy UserId từ JWT Token
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst("UserID")
                     ?? User.FindFirst(ClaimTypes.NameIdentifier)
                     ?? User.FindFirst("sub");

            return int.TryParse(claim?.Value, out int id) ? id : null;
        }
    }
}