using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepositPolicyController : ControllerBase
    {
        private readonly DepositPolicyService _service;

        public DepositPolicyController(DepositPolicyService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("field/{fieldId}")]
        public async Task<IActionResult> GetByFieldId(int fieldId)
        {
            var result = await _service.GetByFieldIdAsync(fieldId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(DepositPolicyDTO dto)
        {
            var result = await _service.AddAsync(dto);
            return CreatedAtAction(nameof(GetByFieldId), new { fieldId = result.FieldId }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, DepositPolicyDTO dto)
        {
            if (id != dto.DepositPolicyId) return BadRequest("ID mismatch");

            var success = await _service.UpdateAsync(dto);
            if (!success) return NotFound();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound();

            return NoContent();
        }
    }
}
