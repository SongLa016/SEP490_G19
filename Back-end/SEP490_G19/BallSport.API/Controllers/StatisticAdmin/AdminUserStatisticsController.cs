using BallSport.Application.Services;
using BallSport.Application.Services.AdminStatistics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/statistics")]
    [Authorize(Roles = "Admin")]
    public class AdminStatisticsController : ControllerBase
    {
        private readonly AdminUserStatisticService _service;
        private readonly IUserService _service2;
        public AdminStatisticsController(AdminUserStatisticService service, IUserService service2)
        {
            _service = service;
            _service2 = service2;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUserStatistics()
        {
            var result = await _service.GetUserStatisticsAsync();
            return Ok(result);
        }

        [HttpPut("lock/{id}")]
        public async Task<IActionResult> ToggleLockUser(int id)
        {
            var result = await _service2.ToggleLockUserAsync(id);
            if (!result.HasValue) return NotFound();

            var message = result.Value ? "User has been locked." : "User has been unlocked.";
            return Ok(new { message });
        }
    }
}
