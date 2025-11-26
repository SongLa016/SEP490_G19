using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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

        [HttpPost("complete/{packageId}")]
        public async Task<IActionResult> Complete(int packageId)
        {
            var success = await _monthlyService.CompleteBookingPackageAsync(packageId);

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
                // Gọi service để hủy slot, nhận QR trả về
                string refundQrUrl = await _monthlyService.CancelPackageSessionAsync(sessionId);

                return Ok(new
                {
                    message = "Session cancelled successfully",
                    refundQr = refundQrUrl
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

    }
}
