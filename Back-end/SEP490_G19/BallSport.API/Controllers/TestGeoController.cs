using BallSport.Application.Services.Geocoding;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/test")]
    public class TestGeoController : ControllerBase
    {
        private readonly IGeocodingService _geo;

        public TestGeoController(IGeocodingService geo)
        {
            _geo = geo;
        }

        [HttpGet("{address}")]
        public async Task<IActionResult> Test(string address)
        {
            var result = await _geo.GetLocationFromAddressAsync(address);
            return Ok(result);
        }
    }

}
