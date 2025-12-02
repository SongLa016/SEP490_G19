using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayerProfileController : ControllerBase
    {
        private readonly IPlayerProfileService _service;

        public PlayerProfileController(IPlayerProfileService service)
        {
            _service = service;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            var profile = await _service.GetProfileByUserIdAsync(userId);
            if (profile == null)
                return NotFound();   
            return Ok(profile);       
        }
    }
}
