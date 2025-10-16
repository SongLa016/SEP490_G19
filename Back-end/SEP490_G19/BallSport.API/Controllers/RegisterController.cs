using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisterController : ControllerBase
    {
        private readonly UserService _userService;

        public RegisterController(UserService userService)
        {
            _userService = userService;
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] RegisterDTO request)
        {
            if (string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.FullName) ||
                string.IsNullOrEmpty(request.Phone) ||
                string.IsNullOrEmpty(request.Password) ||
                string.IsNullOrEmpty(request.RoleName))
                return BadRequest("Vui lòng nhập đầy đủ thông tin.");

            try
            {
                await _userService.SendOtpForRegisterAsync(
                    request.FullName,
                    request.Email,
                    request.Phone,
                    request.Password,
                    request.RoleName
                );

                return Ok(new { message = "Đã gửi OTP đến email của bạn. Vui lòng kiểm tra hộp thư." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (string.IsNullOrEmpty(request.Otp))
                return BadRequest("Vui lòng nhập mã OTP.");

            try
            {
                var result = await _userService.VerifyOtpAndRegisterAsync(request.Otp);
                if (!result)
                    return BadRequest("OTP không hợp lệ hoặc đã hết hạn.");

                return Ok(new { message = "Đăng ký thành công! Hãy đăng nhập để bắt đầu." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
