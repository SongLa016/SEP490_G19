using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FieldScheduleController : ControllerBase
    {
        private readonly FieldScheduleService _service;

        public FieldScheduleController(FieldScheduleService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }

        [HttpGet("field/{fieldId}")]
        public async Task<IActionResult> GetByField(int fieldId)
        {
            var result = await _service.GetByFieldIdAsync(fieldId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(FieldScheduleDTO dto)
        {
            var created = await _service.AddAsync(dto);
            return CreatedAtAction(nameof(GetAll), new { id = created.ScheduleId }, created);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] string status)
        {
            var ok = await _service.UpdateStatusAsync(id, status);
            if (!ok) return NotFound();
            return Ok(new { message = "Cập nhật trạng thái thành công" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
