using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

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

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookingCreateDto dto)
        {
            var booking = await _bookingService.CreateBookingAsync(dto);
            return Ok(booking);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var bookings = await _bookingService.GetAllBookingsAsync();
            return Ok(bookings);
        }

        // Endpoint PayOS callback
        [HttpPost("payos-callback")]
        public async Task<IActionResult> PayOsCallback([FromBody] PayOsCallbackDto dto)
        {
            await _bookingService.HandlePayOsCallbackAsync(dto.BookingId, dto.Status);
            return Ok();
        }
    }

}
