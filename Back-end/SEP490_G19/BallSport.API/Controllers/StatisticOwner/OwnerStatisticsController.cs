using System.Security.Claims;
using System.Threading.Tasks;
using BallSport.Application.Services.OwnerStatistics;
using BallSport.Application.Services.StatisticOwner;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/owner/statistics")]
    [Authorize(Roles = "Owner")]
    public class OwnerStatisticsController : ControllerBase
    {
        private readonly OwnerRecentBookingService _recentBookingService;
        private readonly OwnerTimeSlotStatisticService _service;

        public OwnerStatisticsController(OwnerRecentBookingService recentBookingService, OwnerTimeSlotStatisticService service)
        {
            _recentBookingService = recentBookingService;
            _service = service;
        }

        [HttpGet("recent-bookings")]
        public async Task<IActionResult> GetRecentBookings([FromQuery] int top = 10)
        {
            var ownerIdClaim = User.FindFirst("UserID")?.Value;

            if (string.IsNullOrEmpty(ownerIdClaim) || !int.TryParse(ownerIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "Không xác định được tài khoản Owner" });
            }

            var bookings = await _recentBookingService.GetRecentBookingsAsync(ownerId, top);
            return Ok(bookings);
        }

        [HttpGet("time-slot-performance")]
        public async Task<IActionResult> GetTimeSlotPerformance()
        {
            var ownerIdClaim = User.FindFirst("UserID")?.Value;

            if (string.IsNullOrEmpty(ownerIdClaim) || !int.TryParse(ownerIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "Không xác định được tài khoản Owner" });
            }

            var data = await _service.GetTimeSlotPerformanceAsync(ownerId);

            return Ok(data);
        }
    }
}
