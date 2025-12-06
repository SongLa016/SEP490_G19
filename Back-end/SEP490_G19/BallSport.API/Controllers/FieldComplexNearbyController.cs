using BallSport.Application.Services;
using BallSport.Application.Services.DistanceCalculator;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/field-complex-nearby")]
    [ApiController]
    public class FieldComplexNearbyController : ControllerBase
    {
        private readonly FieldComplexNearbyService _nearbyService;

        public FieldComplexNearbyController(FieldComplexNearbyService nearbyService)
        {
            _nearbyService = nearbyService;
        }
        [HttpGet]
        public async Task<IActionResult> GetNearby(
            [FromQuery] double lat,
            [FromQuery] double lng)
        {
            if (lat == 0 || lng == 0)
                return BadRequest("Latitude và Longitude không hợp lệ");

            var result = await _nearbyService.GetNearbyAsync(lat, lng);

            return Ok(result);
        }
    }
}
