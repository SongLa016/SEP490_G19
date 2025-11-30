using BallSport.Application.DTOs.RatingBooking;
using BallSport.Application.Services.RatingBooking;
using BallSport.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers.RatingBooking
{
    [ApiController]
    [Route("api/ratings")]
    public class RatingController : ControllerBase
    {
        private readonly RatingService _ratingService;

        public RatingController(RatingService ratingService)
        {
            _ratingService = ratingService;
        }

        [HttpPost]
        public async Task<IActionResult> AddRating([FromBody] RatingRequest request)
        {
            var userIdClaim = User.FindFirst("UserID");
            if (userIdClaim == null)
            {
                return Unauthorized("Token không chứa UserID");
            }

            var userId = int.Parse(userIdClaim.Value);

            var result = await _ratingService.AddRatingAsync(userId, request);

            if (result != "Rating submitted successfully")
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("field/{fieldId}")]
        public async Task<IActionResult> GetRatingsByField(int fieldId)
        {
            var ratings = await _ratingService.GetRatingsOfFieldAsync(fieldId);
            return Ok(ratings);
        }
    }

}
