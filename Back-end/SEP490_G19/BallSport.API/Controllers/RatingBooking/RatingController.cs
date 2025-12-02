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

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRating(int id, [FromBody] UpdateRatingDto dto)
        {
            bool updated = await _ratingService.UpdateRatingAsync(id, dto.Stars, dto.Comment);

            if (!updated)
                return NotFound(new { message = "Không tìm thấy đánh giá" });

            return Ok(new { message = "Cập nhật đánh giá thành công" });
        }

        // DELETE: api/rating/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRating(int id)
        {
            bool deleted = await _ratingService.DeleteRatingAsync(id);

            if (!deleted)
                return NotFound(new { message = "Không tìm thấy đánh giá" });

            return Ok(new { message = "Xóa đánh giá thành công" });
        }

        [HttpGet("field/{fieldId}")]
        public async Task<IActionResult> GetRatingsByField(int fieldId)
        {
            var ratings = await _ratingService.GetRatingsOfFieldAsync(fieldId);
            return Ok(ratings);
        }

        [HttpGet("complex/{complexId}")]
        public async Task<IActionResult> GetRatingsByComplexId(int complexId)
        {
            var result = await _ratingService.GetRatingsByComplexIdAsync(complexId);
            return Ok(result);
        }

        public class UpdateRatingDto
        {
            public int Stars { get; set; }
            public string? Comment { get; set; }
        }
    }

}
