using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResertPassController : ControllerBase
    {
        private readonly UserService _userService;

        public ResertPassController(UserService userService)
        {
            _userService = userService;
        }


        /////////////////////// PHẦN 1: Gửi OTP ///////////////////////
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            if (string.IsNullOrEmpty(request.Email))
                return BadRequest("Email is required");

            var user = await _userService.SendOtpForForgotPasswordAsync(request.Email);
            if (user == null)
                return NotFound("User not found with this email");

            return Ok(new { Message = "OTP has been sent to your email." });
        }

        /////////////////////// PHẦN 2: Nhập OTP và đổi mật khẩu ///////////////////////
        
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (string.IsNullOrEmpty(request.Otp))
                return BadRequest("OTP is required");

            var success = await _userService.VerifyOtpAndResetPasswordAsync(request.Otp);
            if (!success)
                return BadRequest("Invalid OTP or user not found");

            return Ok(new { Message = "Password has been reset successfully. Check your email for the new password." });
        }
    }



}

