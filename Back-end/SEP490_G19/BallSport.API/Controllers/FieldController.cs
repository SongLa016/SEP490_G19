using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddField([FromForm] FieldDTO dto)
        {
            // 🔹 Lấy OwnerId từ claim "UserID"
            var ownerIdClaim = User.FindFirst("UserID");
            if (ownerIdClaim == null) return Unauthorized("Không tìm thấy OwnerId trong token.");

            int ownerId = int.Parse(ownerIdClaim.Value);

            var result = await _fieldService.AddFieldAsync(dto, ownerId);
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
        //UPDATE FIELD - chỉ Owner
        [Authorize(Roles = "Owner")]
        [HttpPut("{fieldId}")]
        public async Task<IActionResult> UpdateField(int fieldId, [FromForm] FieldDTO dto)
        {
            if (dto == null || fieldId != dto.FieldId)
                return BadRequest("Invalid data.");

            var updatedField = await _fieldService.UpdateFieldAsync(dto);
            if (updatedField == null)
                return NotFound("Field not found.");

            return Ok(updatedField);
        }
        // DELETE FIELD - chỉ Owner
        [Authorize(Roles = "Owner")]
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