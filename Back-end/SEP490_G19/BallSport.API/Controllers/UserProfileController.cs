using BallSport.Application.DTOs;
using BallSport.Application.DTOs.UserProfile;
using BallSport.Application.Services;
using BallSport.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using static BallSport.Infrastructure.Repositories.UserProfileRepository;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserProfileController : ControllerBase
    {
        private readonly UserProfileService _profileService;
        private readonly UserService _userService;

        public UserProfileController(UserProfileService profileService, UserService userService)
        {
            _profileService = profileService;
            _userService = userService;
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

        [HttpPost("change-password")]
        [Authorize] // 🔐 BẮT BUỘC đăng nhập
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO request)
        {
            if (string.IsNullOrEmpty(request.OldPassword) ||
                string.IsNullOrEmpty(request.NewPassword) ||
                string.IsNullOrEmpty(request.ConfirmNewPassword))
            {
                return BadRequest("Vui lòng nhập đầy đủ thông tin.");
            }

            // ✅ THỐNG NHẤT: dùng "UserID" giống các API khác
            var userIdClaim = User.FindFirst("UserID");
            if (userIdClaim == null)
                return Unauthorized("Token không hợp lệ.");

            int userId = int.Parse(userIdClaim.Value);

            await _userService.ChangePasswordAsync(
                userId,
                request.OldPassword,
                request.NewPassword,
                request.ConfirmNewPassword
            );

            return Ok(new
            {
                Message = "Đổi mật khẩu thành công."
            });
        }



    }
}
