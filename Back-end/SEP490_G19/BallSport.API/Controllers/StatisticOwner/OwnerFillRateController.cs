using BallSport.Application.Services.StatisticOwner;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers.StatisticOwner
{
    [Route("api/owner/statistics/fillrate")]
    [ApiController]
    [Authorize(Roles = "Owner")]
    public class OwnerFillRateController : ControllerBase
    {
        private readonly OwnerFillRateService _service;

        public OwnerFillRateController(OwnerFillRateService service)
        {
            _service = service;
        }

        // GET: /api/owner/statistics/fillrate
        [HttpGet]
        public async Task<IActionResult> GetFillRate()
        {
            var ownerIdClaim = User.FindFirst("UserID")?.Value;

            if (string.IsNullOrEmpty(ownerIdClaim) || !int.TryParse(ownerIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "Không xác định được tài khoản Owner" });
            }

            double rate = await _service.GetFillRateAsync(ownerId);

            return Ok(new
            {
                fillRate = rate,
                formatted = $"{rate:0.00}%"
            });
        }
    }
}
