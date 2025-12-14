using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FieldComplexController : ControllerBase
    {
        private readonly FieldComplexService _service;

        public FieldComplexController(FieldComplexService service)
        {
            _service = service;
        }

        // PUBLIC
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllComplexesAsync();
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var complex = await _service.GetComplexByIdAsync(id);
            if (complex == null)
                return NotFound($"Không tìm thấy khu sân có ID = {id}");

            return Ok(complex);
        }


        // OWNER - CREATE
        [Authorize(Roles = "Owner")]
        [HttpPost]
        public async Task<IActionResult> AddComplex([FromForm] FieldComplexDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = int.Parse(User.FindFirst("UserID")!.Value);

                var created = await _service.AddComplexAsync(
                    dto,
                    userId,
                    "Owner"
                );

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = created.ComplexId },
                    created
                );
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message); 
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // OWNER, ADMIN 
        [Authorize(Roles = "Owner,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComplex(int id,[FromForm] FieldComplexDTO dto)
        {
            if (!ModelState.IsValid || id != dto.ComplexId)
                return BadRequest("Dữ liệu không hợp lệ");

            var userId = int.Parse(User.FindFirst("UserID")!.Value);
            var role = User.FindFirst("Role")?.Value;

            try
            {
                var updated = await _service.UpdateComplexAsync(dto, userId, role!);

                if (updated == null)
                    return NotFound($"Không tìm thấy khu sân có ID = {id}");

                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        // OWNER - DELETE
        [Authorize(Roles = "Owner")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComplex(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserID")!.Value);
                var role = User.FindFirst("Role")!.Value;

                var deleted = await _service.DeleteComplexAsync(id, userId, role);

                if (!deleted)
                    return NotFound(new
                    {
                        message = $"Không tìm thấy khu sân có ID = {id}"
                    });

                // XÓA THÀNH CÔNG
                return Ok(new
                {
                    message = "Xóa khu sân thành công."
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                // 
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = ex.Message
                });
            }
        }

    }
}
