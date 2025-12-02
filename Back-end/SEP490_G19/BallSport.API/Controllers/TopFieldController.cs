using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;
using static BallSport.Infrastructure.Repositories.TopFieldRepository;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopFieldController : ControllerBase
    {
        private readonly ITopFieldService _topFieldService;
        public TopFieldController(ITopFieldService topFieldService)
        {
            _topFieldService = topFieldService;
        }

        [HttpGet("top-field")]
        public async Task<IActionResult> GetTopField()
        {
            List<TopFieldDto> result = await _topFieldService.GetTopFieldBookingsAsync();
            return Ok(result);
        }
    }
}
