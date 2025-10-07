using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FieldController : ControllerBase
    {
        private readonly FieldService _fieldService;

        public FieldController(FieldService fieldService)
        {
            _fieldService = fieldService;
        }

        // CREATE
        [HttpPost]
        public async Task<IActionResult> AddField([FromBody] FieldDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid data.");

            var result = await _fieldService.AddFieldAsync(dto);
            return CreatedAtAction(nameof(GetFieldById), new { fieldId = result.FieldId }, result);
        }

        // READ ALL BY COMPLEX
        [HttpGet("complex/{complexId}")]
        public async Task<IActionResult> GetFieldsByComplex(int complexId)
        {
            var fields = await _fieldService.GetFieldsByComplexIdAsync(complexId);
            if (fields == null || !fields.Any())
                return NotFound("No fields found for this complex.");

            return Ok(fields);
        }

        // READ BY ID
        [HttpGet("{fieldId}")]
        public async Task<IActionResult> GetFieldById(int fieldId)
        {
            var field = await _fieldService.GetFieldByIdAsync(fieldId);
            if (field == null)
                return NotFound("Field not found.");

            return Ok(field);
        }

        // UPDATE
        [HttpPut("{fieldId}")]
        public async Task<IActionResult> UpdateField(int fieldId, [FromBody] FieldDTO dto)
        {
            if (dto == null || fieldId != dto.FieldId)
                return BadRequest("Invalid data.");

            var updatedField = await _fieldService.UpdateFieldAsync(dto);
            if (updatedField == null)
                return NotFound("Field not found.");

            return Ok(updatedField);
        }

        // DELETE
        [HttpDelete("{fieldId}")]
        public async Task<IActionResult> DeleteField(int fieldId)
        {
            var deleted = await _fieldService.DeleteFieldAsync(fieldId);
            if (!deleted)
                return NotFound("Field not found or could not be deleted.");

            return NoContent(); // 204
        }
    }
}
