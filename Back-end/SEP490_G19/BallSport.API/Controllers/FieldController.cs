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

        // CREATE FIELD
        [Authorize(Roles = "Owner")]
        [HttpPost]
        public async Task<IActionResult> AddField([FromForm] FieldDTO dto)
        {
            var ownerIdClaim = User.FindFirst("UserID");
            if (ownerIdClaim == null)
                return Unauthorized("Không tìm thấy OwnerId trong token.");

            int ownerId = int.Parse(ownerIdClaim.Value);

            try
            {
                var result = await _fieldService.AddFieldAsync(dto, ownerId);
                return CreatedAtAction(nameof(GetFieldById), new { fieldId = result.FieldId }, result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        //GET FIELDS BY COMPLEX
        [HttpGet("complex/{complexId}")]
        public async Task<IActionResult> GetFieldsByComplex(int complexId)
        {
            var fields = await _fieldService.GetFieldsByComplexIdAsync(complexId);
            if (fields == null || !fields.Any())
                return NotFound("Không tìm thấy field nào thuộc Complex này.");

            return Ok(fields);
        }

        //  GET FIELD BY ID
        [HttpGet("{fieldId}")]
        public async Task<IActionResult> GetFieldById(int fieldId)
        {
            var field = await _fieldService.GetFieldByIdAsync(fieldId);
            if (field == null)
                return NotFound("Không tìm thấy field.");

            return Ok(field);
        }

        // UPDATE FIELD
        [Authorize(Roles = "Owner")]
        [HttpPut("{fieldId}")]
        public async Task<IActionResult> UpdateField(int fieldId, [FromForm] FieldDTO dto)
        {
            if (dto == null || dto.FieldId != fieldId)
                return BadRequest("Dữ liệu không hợp lệ.");

            var ownerIdClaim = User.FindFirst("UserID");
            if (ownerIdClaim == null) return Unauthorized("Không tìm thấy OwnerId trong token.");
            int ownerId = int.Parse(ownerIdClaim.Value);

            try
            {
                var updated = await _fieldService.UpdateFieldAsync(dto, ownerId);
                if (updated == null) return NotFound("Field không tồn tại.");

                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        // DELETE FIELD
        [Authorize(Roles = "Owner")]
        [HttpDelete("{fieldId}")]
        public async Task<IActionResult> DeleteField(int fieldId)
        {
            var ownerIdClaim = User.FindFirst("UserID");
            if (ownerIdClaim == null) return Unauthorized("Không tìm thấy OwnerId trong token.");
            int ownerId = int.Parse(ownerIdClaim.Value);

            try
            {
                var deleted = await _fieldService.DeleteFieldAsync(fieldId, ownerId);
                if (!deleted) return NotFound("Field không tồn tại.");

                return Ok("Xóa field thành công.");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        // GET FIELDS BY OWNER 
        [Authorize(Roles = "Owner")]
        [HttpGet("owner")]
        public async Task<IActionResult> GetFieldsForOwner()
        {
            var ownerIdClaim = User.FindFirst("UserID");
            if (ownerIdClaim == null) return Unauthorized("Không tìm thấy OwnerId trong token.");

            int ownerId = int.Parse(ownerIdClaim.Value);

            var fields = await _fieldService.GetFieldsByOwnerIdAsync(ownerId);
            if (fields == null || !fields.Any())
                return NotFound("Không tìm thấy field nào cho Owner này.");

            return Ok(fields);
        }
    }
}
