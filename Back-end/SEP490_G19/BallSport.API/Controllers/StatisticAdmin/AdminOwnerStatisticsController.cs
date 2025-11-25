using BallSport.Application.Services.AdminStatistics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/statistics")]
    [Authorize(Roles = "Admin")]
    public class AdminOwnerStatisticsController : ControllerBase
    {
        private readonly AdminOwnerStatisticService _ownerService;

        public AdminOwnerStatisticsController(AdminOwnerStatisticService ownerService)
        {
            _ownerService = ownerService;
        }

        [HttpGet("owners")]
        public async Task<IActionResult> GetTotalOwners()
        {
            var result = await _ownerService.GetTotalOwnersAsync();
            return Ok(result);
        }
    }
}
