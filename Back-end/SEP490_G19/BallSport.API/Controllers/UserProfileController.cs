using BallSport.Application.DTOs;
using BallSport.Application.DTOs.UserProfile;
using BallSport.Application.Services;
using BallSport.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static BallSport.Infrastructure.Repositories.UserProfileRepository;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserProfileController : ControllerBase
    {
        private readonly UserProfileService _profileService;

        public UserProfileController(UserProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpGet("profile")]
        [Authorize] // yêu cầu đăng nhập
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirst("UserID")!.Value);

            var role = User.FindFirst("Role").Value;

            var profile = await _profileService.GetProfileAsync(userId, role);

            if (profile == null)
                return NotFound("User profile not found.");

            return Ok(profile);
        }

        [HttpPut("profile/player")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequest request)
        {
            var userId = int.Parse(User.FindFirst("UserID")!.Value);
            var role = User.FindFirst("Role")!.Value;

            var updatedProfile = await _profileService.UpdateProfileAsync(userId, role, request);

            return Ok(updatedProfile);
        }


        [HttpPut("profile/admin-owner")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateBasicProfileRequest request)
        {
            var userId = int.Parse(User.FindFirst("UserID")!.Value);

            var updatedProfile = await _profileService.UpdateBasicProfileAsync(userId, request);

            return Ok(updatedProfile);
        }
    }
}
