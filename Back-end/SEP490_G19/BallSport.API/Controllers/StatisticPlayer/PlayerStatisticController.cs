using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers.Player
{
    [Route("api/player/statistic")]
    [ApiController]
    [Authorize(Roles = "Player")]
    public class PlayerStatisticController : ControllerBase
    {
        private readonly PlayerStatisticService _statisticService;
        private readonly PlayerRecentActivityService _recentActivityService;
        public PlayerStatisticController(PlayerStatisticService statisticService, PlayerRecentActivityService recentActivityService)
        {
            _statisticService = statisticService;
            _recentActivityService = recentActivityService;
        }

        [HttpGet("total-bookings")]
        public async Task<IActionResult> GetTotalBookings()
        {
            var userId = int.Parse(User.FindFirst("UserID").Value);

            var total = await _statisticService.GetTotalBookingsAsync(userId);

            return Ok(new { totalBookings = total });
        }
        [HttpGet("total-playing")]
        public async Task<IActionResult> GetStats()
        {
            var userId = int.Parse(User.FindFirst("UserID").Value);

            var stats = await _statisticService.GetTotalPlayingHoursAsync(userId);

            return Ok(stats);
        }

        [HttpGet("total-spending")]
        public async Task<IActionResult> GetSpending()
        {
            var userId = int.Parse(User.FindFirst("UserID").Value);

            var stats = await _statisticService.GetTotalSpendingAsync(userId);

            return Ok(stats);
        }

        [HttpGet("stats/monthly")]
        public async Task<IActionResult> GetMonthlyStats()
        {
            var userId = int.Parse(User.FindFirst("UserID")!.Value);

            var stats = await _statisticService.GetMonthlyStatsAsync(userId);

            return Ok(stats);
        }

        [HttpGet("average-rating")]
        public async Task<IActionResult> GetAverageRating()
        {
            // Lấy UserId từ token
            var userId = int.Parse(User.FindFirst("UserID")!.Value);

            double avgRating = await _statisticService.GetAverageRatingAsync(userId);

            return Ok(new { averageStars = avgRating });
        }

        [HttpGet("recent-activity")]
        public async Task<IActionResult> GetRecentActivities([FromQuery] int top = 10)
        {
            // Lấy userId từ token
            var userId = int.Parse(User.FindFirst("UserID")!.Value);

            var activities = await _recentActivityService.GetRecentActivitiesAsync(userId, top);

            return Ok(activities);
        }
    }
}
