using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BookingCancellationReController : ControllerBase
    {
        private readonly BookingCancellationReService _service;

        public BookingCancellationReController(BookingCancellationReService service)
        {
            _service = service;
        }

        
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requests = await _service.GetAllAsync();
            return Ok(requests);
        }

        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var request = await _service.GetByIdAsync(id);
            if (request == null)
                return NotFound("Không tìm thấy yêu cầu hủy.");
            return Ok(request);
        }


        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookingCancellationReDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst("UserID")?.Value;
            if (userIdClaim == null)
                return Unauthorized("Không xác định được user.");

            int userId = int.Parse(userIdClaim);

            try
            {
                var request = await _service.CreateAsync(dto.BookingId, userId, dto.Reason);
                return Ok(request);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize]
        [HttpPut("confirm/{id}")]
        public async Task<IActionResult> Confirm(int id)
        {
            var staffIdClaim = User.FindFirst("UserID")?.Value;
            if (staffIdClaim == null)
                return Unauthorized("Không xác định được người xác nhận.");

            int verifiedBy = int.Parse(staffIdClaim);

            try
            {
                var cancellation = await _service.ConfirmCancellationAsync(id, verifiedBy);
                return Ok(cancellation);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 🔹 DELETE: api/BookingCancellationRe/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _service.DeleteAsync(id);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
