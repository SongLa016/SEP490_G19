using BallSport.Application.Services.AdminStatistics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers.StatisticAdmin
{
    [ApiController]
    [Route("api/admin/statistics")]
    [Authorize(Roles = "Admin")]
    public class AdminStatisticsController : ControllerBase
    {
        private readonly BookingStatisticService _bookingService;
        private readonly RevenueStatisticService _revenueService;
        private readonly FieldStatisticService _fieldService;
        private readonly ReportStatisticService _reportService;
        private readonly AdminRecentActivityService _recentActivityService;
        private readonly IPostStatisticService _postService;
        private readonly IUserListService _userListService;
        public AdminStatisticsController(BookingStatisticService bookingService, RevenueStatisticService revenueService,
            FieldStatisticService fieldService, ReportStatisticService reportService,
            AdminRecentActivityService recentActivityService, IPostStatisticService postService, IUserListService userListService)
        {
            _bookingService = bookingService;
            _revenueService = revenueService;
            _fieldService = fieldService;
            _reportService = reportService;
            _recentActivityService = recentActivityService;
            _postService = postService;
            _userListService = userListService;
        }
        // tổng số bookings
        [HttpGet("bookings")]
        public async Task<IActionResult> GetBookingStatistics()
        {
            var result = await _bookingService.GetBookingStatisticAsync();
            return Ok(result);
        }
        // tổng doanh thu 
        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenueStatistics()
        {
            var result = await _revenueService.GetRevenueStatisticAsync();
            return Ok(result);
        }
        // tổng số fields
        [HttpGet("fields")]
        public async Task<IActionResult> GetFieldStatistics()
        {
            var result = await _fieldService.GetFieldStatisticsAsync();
            return Ok(result);
        }
        // tổng số report
        [HttpGet("reports")]
        public async Task<IActionResult> GetReportStatistics()
        {
            var (currentCount, percentageChange) = await _reportService.GetReportStatisticsAsync();
            return Ok(new
            {
                TotalReports = currentCount,
                PercentageChange = percentageChange
            });
        }
        // tổng số report đang chờ xử lí
        [HttpGet("reports/pending")]
        public async Task<IActionResult> GetPendingReportStatistics()
        {
            var (currentPending, percentageChange) = await _reportService.GetPendingReportStatisticsAsync();
            return Ok(new
            {
                PendingReports = currentPending,
                PercentageChange = percentageChange
            });
        }
        //// tổng số bài đăng
        [HttpGet("posts")]
        public async Task<IActionResult> GetPostsStatistics()
        {
            var result = await _postService.GetPostStatisticsAsync();
            return Ok(result);
        }
        // danh sách người dùng không phải admin
        [HttpGet("users/all")]
        public async Task<IActionResult> GetAllUsersExceptAdmin()
        {
            var users = await _userListService.GetUsersAsync();
            return Ok(users);
        }

        [HttpGet("recent-activities")]
        public async Task<IActionResult> GetRecentActivities()
        {
            var activities = await _recentActivityService.GetRecentActivitiesAsync(20);

            // Map thời gian sang "x phút trước", "x giờ trước"
            var now = DateTime.Now;
            var result = activities.Select(a => new
            {
                a.ActivityType,
                a.Description,
                TimeAgo = FormatTimeAgo(a.CreatedAt, now)
            });

            return Ok(result);
        }
        private string FormatTimeAgo(DateTime createdAt, DateTime now)
        {
            var span = now - createdAt;

            if (span.TotalMinutes < 1)
                return "Vừa xong";
            if (span.TotalMinutes < 60)
                return $"{(int)span.TotalMinutes} phút trước";
            if (span.TotalHours < 24)
                return $"{(int)span.TotalHours} giờ trước";
            if (span.TotalDays < 7)
                return $"{(int)span.TotalDays} ngày trước";
            if (span.TotalDays < 30)
                return $"{(int)(span.TotalDays / 7)} tuần trước";
            return createdAt.ToString("dd/MM/yyyy");
        }
    }
}
