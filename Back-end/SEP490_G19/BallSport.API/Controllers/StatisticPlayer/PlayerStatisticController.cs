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

        public PlayerStatisticController(PlayerStatisticService statisticService)
        {
            _statisticService = statisticService;
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
        [Authorize(Roles = "Player")]
        public async Task<IActionResult> GetMonthlyStats()
        {
            var userId = int.Parse(User.FindFirst("UserID")!.Value);

            var stats = await _statisticService.GetMonthlyStatsAsync(userId);

            return Ok(stats);
        }

    }
}
