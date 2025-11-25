using BallSport.Application.Services.StatisticOwner;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers.StatisticOwner
{
    [ApiController]
    [Route("api/owner/statistics")]
    [Authorize(Roles = "Owner")]
    public class OwnerDailyRevenueController : ControllerBase
    {
        private readonly OwnerDailyRevenueService _service;
        public OwnerDailyRevenueController(OwnerDailyRevenueService service)
        {
            _service = service;
        }
        [HttpGet("revenue/daily")]
        public async Task<IActionResult> GetDailyRevenue()
        {
            var ownerIdClaim = User.FindFirst("UserID")?.Value;

            if (string.IsNullOrEmpty(ownerIdClaim) || !int.TryParse(ownerIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "Không xác định được tài khoản Owner" });
            }

            var data = await _service.GetDailyRevenueAsync(ownerId);

            return Ok(data);
        }

    }
}
