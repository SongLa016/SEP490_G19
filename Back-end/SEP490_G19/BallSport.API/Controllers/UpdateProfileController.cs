using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UpdateProfileController : ControllerBase
    {
        private readonly UserService _userService;

        public UpdateProfileController(UserService userService)
        {
            _userService = userService;
        }

        [HttpPost("update-profile")]
        [Authorize]
        public IActionResult UpdateProfile([FromBody] UserProfileDTO profileDto)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UserID");
                if (userIdClaim == null)
                    return Unauthorized("Không tìm thấy UserId trong token.");

                int userId = int.Parse(userIdClaim.Value);

                _userService.AddOrUpdateUserProfile(userId, profileDto);

                return Ok(new { message = "Cập nhật profile thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }



    }
}
