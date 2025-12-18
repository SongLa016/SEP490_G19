using System.Security.Claims;
using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/owner/deposit-policies")]
    [Authorize(Roles = "Owner")]
    public class DepositPolicyController : ControllerBase
    {
        private readonly DepositPolicyService _service;

        public DepositPolicyController(DepositPolicyService service)
        {
            _service = service;
        }

        // GET OWNER ID
        private int GetOwnerId()
        {
            var userIdClaim = User.FindFirst("UserID");

            if (userIdClaim == null)
                throw new UnauthorizedAccessException("Token không chứa UserID");

            return int.Parse(userIdClaim.Value);
        }


        // GET ALL (OWNER)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var ownerId = GetOwnerId();
            var result = await _service.GetAllAsync(ownerId);
            return Ok(result);
        }

        // GET BY FIELD ID
        [HttpGet("field/{fieldId:int}")]
        public async Task<IActionResult> GetByFieldId(int fieldId)
        {
            var ownerId = GetOwnerId();
            var result = await _service.GetByFieldIdAsync(fieldId, ownerId);

            if (result == null)
                return NotFound("Sân này chưa có chính sách cọc");

            return Ok(result);
        }

        // CREATE
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] DepositPolicyDTO dto)
        {
            var ownerId = GetOwnerId();
            var created = await _service.AddAsync(dto, ownerId);

            return CreatedAtAction(
                nameof(GetByFieldId),
                new { fieldId = created.FieldId },
                created
            );
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id,[FromForm] DepositPolicyDTO dto)
        {
            if (id != dto.DepositPolicyId)
                return BadRequest("ID mismatch");

            int ownerId = GetOwnerId();

            var updated = await _service.UpdateAsync(dto, ownerId);
            if (updated == null) return NotFound();

            return Ok(updated); 
        }


        // DELETE
        [HttpDelete("{id:int}/field/{fieldId:int}")]
        public async Task<IActionResult> Delete(int id, int fieldId)
        {
            var ownerId = GetOwnerId();
            var success = await _service.DeleteAsync(id, fieldId, ownerId);

            if (!success)
                return NotFound();

            return Ok(success);
        }
    }
}
