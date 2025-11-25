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

        public AdminStatisticsController(AdminUserStatisticService service)
        {
            _service = service;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUserStatistics()
        {
            var result = await _service.GetUserStatisticsAsync();
            return Ok(result);
        }
    }
}
