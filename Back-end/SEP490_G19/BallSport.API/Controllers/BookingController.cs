using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly BookingService _bookingService;

        public BookingController(BookingService bookingService)
        {
            _bookingService = bookingService;
        }

        /// <summary>
        /// 🧾 Tạo booking mới và sinh mã VietQR để thanh toán
        /// </summary>
        [HttpPost("create")]
        public async Task<IActionResult> CreateBooking([FromBody] BookingCreateDto dto)
        {
            if (dto == null)
                return BadRequest("Invalid booking data");

            var booking = await _bookingService.CreateBookingAsync(dto);

            if (booking == null)
                return StatusCode(500, "Failed to create booking");

            return Ok(new
            {
                Message = "Booking created successfully",
                BookingId = booking.BookingId,
                TotalPrice = booking.TotalPrice,
                DepositAmount = booking.DepositAmount,
                RemainingAmount = booking.RemainingAmount,
                QrCodeUrl = booking.Qrcode,
                QrExpiresAt = booking.QrexpiresAt
            });
        }

        //Sinh mã VietQR để khách hàng thanh toán phần tiền còn lại của booking
        [HttpPut("confirm-payment/{bookingId}")]
        public async Task<IActionResult> ConfirmPayment([FromRoute] int bookingId, [FromBody] ConfirmPaymentDto dto)
        {
            if (bookingId <= 0) return BadRequest("Invalid booking ID");

            var success = await _bookingService.ConfirmPaymentManualAsync(bookingId, dto.Amount);

            if (!success) return BadRequest("Payment confirmation failed");

            return Ok(new
            {
                Message = "Payment confirmed successfully",
                BookingId = bookingId,
                Amount = dto.Amount
            });
        }

        [HttpGet("generate-qr/{bookingId}")]
        public async Task<IActionResult> GeneratePaymentQr([FromRoute] int bookingId)
        {
            if (bookingId <= 0) return BadRequest("Invalid booking ID");

            try
            {
                var qrUrl = await _bookingService.GeneratePaymentRequestAsync(bookingId);
                return Ok(new
                {
                    Message = "QR code generated successfully",
                    BookingId = bookingId,
                    QrCodeUrl = qrUrl
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPut("confirm-by-owner/{bookingId}")]
        public async Task<IActionResult> ConfirmBookingByOwner([FromRoute] int bookingId)
        {
            if (bookingId <= 0) return BadRequest("Invalid booking ID");

            try
            {
                var success = await _bookingService.ConfirmBookingByOwnerAsync(bookingId);
                return Ok(new
                {
                    Message = "Booking confirmed by owner",
                    BookingId = bookingId,
                    Success = success
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }


        [HttpGet("player/{userId}")]
        public async Task<IActionResult> GetBookingsForPlayer(int userId)
        {
            var data = await _bookingService.GetBookingsByUserIdAsync(userId);
            return Ok(data);
        }

        [HttpGet("owner/{userId}")]
        public async Task<IActionResult> GetBookingsForOwner(int userId)
        {
            if (userId <= 0) return BadRequest("Invalid owner user ID");

            try
            {
                var data = await _bookingService.GetBookingsByOwnerUserIdAsync(userId);
                return Ok(data);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

    }
}