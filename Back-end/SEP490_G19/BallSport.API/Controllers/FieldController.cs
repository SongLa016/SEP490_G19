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

        
        [HttpPost]
        public async Task<IActionResult> AddField([FromBody] FieldDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid data.");

            var result = await _fieldService.AddFieldAsync(dto);
            return CreatedAtAction(nameof(GetFieldById), new { fieldId = result.FieldId }, result);
        }

        
        [HttpGet("complex/{complexId}")]
        public async Task<IActionResult> GetFieldsByComplex(int complexId)
        {
            var fields = await _fieldService.GetFieldsByComplexIdAsync(complexId);
            if (fields == null || !fields.Any())
                return NotFound("No fields found for this complex.");

            return Ok(fields);
        }

        
        [HttpGet("{fieldId}")]
        public async Task<IActionResult> GetFieldById(int fieldId)
        {
            var field = await _fieldService.GetFieldByIdAsync(fieldId);
            if (field == null)
                return NotFound("Field not found.");

            return Ok(field);
        }
    }
}