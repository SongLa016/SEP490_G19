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
    public class OwnerFieldPerformanceController : ControllerBase
    {
        private readonly OwnerFieldPerformanceService _service;

        public OwnerFieldPerformanceController(OwnerFieldPerformanceService service)
        {
            _service = service;
        }

        [HttpGet("fields/performance")]
        public async Task<IActionResult> GetFieldPerformance()
        {
            var ownerIdClaim = User.FindFirst("UserID")?.Value;

            if (string.IsNullOrEmpty(ownerIdClaim) || !int.TryParse(ownerIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "Không xác định được tài khoản Owner" });
            }

            var result = await _service.GetFieldPerformanceAsync(ownerId);
            return Ok(result);
        }
    }
}
