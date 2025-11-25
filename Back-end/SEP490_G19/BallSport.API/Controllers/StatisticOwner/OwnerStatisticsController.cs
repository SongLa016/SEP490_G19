using BallSport.Application.Services.StatisticOwner;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/owner/statistics")]
    [Authorize(Roles = "Owner")]
    public class OwnerStatisticsController : ControllerBase
    {
        private readonly OwnerRecentBookingService _recentBookingService;

        public OwnerStatisticsController(OwnerRecentBookingService recentBookingService)
        {
            _recentBookingService = recentBookingService;
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
    }
}
