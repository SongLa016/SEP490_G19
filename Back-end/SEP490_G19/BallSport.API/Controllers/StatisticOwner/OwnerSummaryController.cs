using BallSport.Application.Services.StatisticOwner;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace BallSport.API.Controllers.StatisticOwner
{
    [Route("api/owner/statistics")]
    [ApiController]
    [Authorize(Roles = "Owner")]
    public class OwnerSummaryController : ControllerBase
    {
        private readonly OwnerSummaryService _service;

        public OwnerSummaryController(OwnerSummaryService service)
        {
            _service = service;
        }

        // tổng doanh thu
        [HttpGet("revenue/total")]
        public async Task<IActionResult> GetTotalRevenue()
        {
            var ownerIdClaim = User.FindFirst("UserID")?.Value;

            if (string.IsNullOrEmpty(ownerIdClaim) || !int.TryParse(ownerIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "Không xác định được tài khoản Owner" });
            }
            var revenue = await _service.GetTotalRevenueAsync(ownerId);
            return Ok(new { totalRevenue = revenue });
        }

        // tổng số lượt đặt sân
        [HttpGet("booking/total")]
        public async Task<IActionResult> GetTotalBooking()
        {
            var ownerIdClaim = User.FindFirst("UserID")?.Value;

            if (string.IsNullOrEmpty(ownerIdClaim) || !int.TryParse(ownerIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "Không xác định được tài khoản Owner" });
            }
            var total = await _service.GetTotalBookingAsync(ownerId);
            return Ok(new { totalBooking = total });
        }
    }
}
