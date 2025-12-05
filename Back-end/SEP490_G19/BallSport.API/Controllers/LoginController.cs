using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly UserService _userService;


        public LoginController(UserService userService)
        {
            _userService = userService;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO loginDto)
        {
            try
            {
                var token = _userService.Login(loginDto.Phone, loginDto.Password);
                return Ok(new
                {
                    message = "Đăng nhập thành công",
                    token
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                // Nếu tài khoản bị khóa hoặc sai mật khẩu, service sẽ ném exception
                return Unauthorized(new { message = ex.Message });
            }
        }


        [HttpPost("login-google")]
        public IActionResult LoginWithGoogle([FromBody] LoginGoogle googleDto)
        {
            var token = _userService.HandleGoogleLogin(googleDto.Email, googleDto.Name);

            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { message = "Không thể đăng nhập bằng Google" });
            }

            return Ok(new
            {
                message = "Đăng nhập Google thành công",
                token
            });
        }



    }
}
