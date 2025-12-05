using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingPackageController : ControllerBase
    {

        private readonly MonthlyBookingService _monthlyService;

        public BookingPackageController(MonthlyBookingService monthlyService)
        {
            _monthlyService = monthlyService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] BookingPackageCreateDto dto)
        {
            var result = await _monthlyService.CreateBookingPackageAsync(dto);

            return Ok(new
            {
                message = "Create monthly booking package successfully",
                data = result
            });
        }


        // ================= CONFIRM BOOKING BY OWNER ===================
        [HttpPost("confirm/{packageId}")]
        public async Task<IActionResult> Confirm(int packageId)
        {
            var success = await _monthlyService.ConfirmBookingByOwnerAsync(packageId);

            if (!success)
            {
                return NotFound(new
                {
                    message = "Booking package not found or cannot be confirmed"
                });
            }

            return Ok(new
            {
                message = "Booking package confirmed successfully"
            });
        }

        [HttpPut("complete/{BookingPackageId}")]
        public async Task<IActionResult> Complete(int BookingPackageId)
        {
            var success = await _monthlyService.CompleteBookingPackageAsync(BookingPackageId);

            if (!success)
            {
                return NotFound(new { message = "Booking package not found or cannot be completed" });
            }

            return Ok(new { message = "Booking package completed successfully" });
        }


        [HttpPost("cancel-session/{sessionId}")]
        public async Task<IActionResult> CancelSession(int sessionId)
        {
            try
            {
                var result = await _monthlyService.CancelPackageSessionAsync(sessionId);
                return Ok(new
                {
                    message = "Session cancelled successfully",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // ================= Player: lấy booking packages của player =================
        [HttpGet("player/packages")]
        public async Task<IActionResult> GetMyBookingPackages()
        {
            try
            {
                var userIdClaim = User.FindFirst("UserID")?.Value;
                if (userIdClaim == null)
                    return Unauthorized(new { message = "UserID claim not found in token" });

                int userId = int.Parse(userIdClaim);

                var data = await _monthlyService.GetBookingPackagesForPlayerAsync(userId);
                return Ok(new { message = "Player booking packages", data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ================= Owner: lấy booking packages của các field owner quản lý =================
        [HttpGet("owner/packages")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetOwnerBookingPackages()
        {
            try
            {
                var userIdClaim = User.FindFirst("UserID")?.Value;
                if (userIdClaim == null)
                    return Unauthorized(new { message = "UserID claim not found in token" });

                int ownerId = int.Parse(userIdClaim);

                var data = await _monthlyService.GetBookingPackagesForOwnerAsync(ownerId);
                return Ok(new { message = "Owner booking packages", data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ================= Player: lấy package sessions của player =================
        [HttpGet("player/sessions")]
        public async Task<IActionResult> GetMyPackageSessions()
        {
            try
            {
                var userIdClaim = User.FindFirst("UserID")?.Value;
                if (userIdClaim == null)
                    return Unauthorized(new { message = "UserID claim not found in token" });

                int userId = int.Parse(userIdClaim);

                var data = await _monthlyService.GetPackageSessionsForPlayerAsync(userId);
                return Ok(new { message = "Player package sessions", data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ================= Owner: lấy package sessions thuộc các field owner quản lý =================
        [HttpGet("owner/sessions")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> GetOwnerPackageSessions()
        {
            try
            {
                var userIdClaim = User.FindFirst("UserID")?.Value;
                if (userIdClaim == null)
                    return Unauthorized(new { message = "UserID claim not found in token" });

                int ownerId = int.Parse(userIdClaim);

                var data = await _monthlyService.GetPackageSessionsForOwnerAsync(ownerId);
                return Ok(new { message = "Owner package sessions", data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}    

