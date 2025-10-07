using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TimeSlotController : ControllerBase
    {
        private readonly TimeSlotService _service;

        public TimeSlotController(TimeSlotService service)
        {
            _service = service;
        }
        // Lấy tất cả các khung giờ
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }
        // Chọn 1 khung giờ
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var slot = await _service.GetByIdAsync(id);
            if (slot == null) return NotFound();
            return Ok(slot);
        }
        // Thêm slot mới
        [HttpPost]
        public async Task<IActionResult> Create(TimeSlotDTO dto)
        {
            var created = await _service.AddAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.SlotId }, created);
        }
        // Sửa slot
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, TimeSlotDTO dto)
        {
            if (id != dto.SlotId) return BadRequest("ID không khớp");
            var updated = await _service.UpdateAsync(dto);
            if (updated == null) return NotFound();
            return Ok(updated);
        }
        // Xóa slot
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
