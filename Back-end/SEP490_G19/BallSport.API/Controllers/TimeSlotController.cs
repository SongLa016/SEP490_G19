using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class TimeSlotController : ControllerBase
{
    private readonly ITimeSlotService _service;

    public TimeSlotController(ITimeSlotService service)
    {
        _service = service;
    }

    // Lấy OwnerId từ token
    private int GetOwnerId()
    {
        var ownerIdClaim = User.FindFirst("UserID");
        if (ownerIdClaim == null)
            throw new UnauthorizedAccessException("Không tìm thấy OwnerId trong token.");
        return int.Parse(ownerIdClaim.Value);
    }

    // public
    [HttpGet("public/{fieldId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicByField(int fieldId)
    {
        var slots = await _service.GetPublicByFieldIdAsync(fieldId);
        return Ok(slots);
    }

    // lấy ra hết sân 
    [HttpGet]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetAll()
    {
        var ownerId = GetOwnerId();
        var slots = await _service.GetAllAsync(ownerId);
        return Ok(slots);
    }
    // lấy chi tiết 1 sân
    [HttpGet("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetById(int id)
    {
        var ownerId = GetOwnerId();
        var slot = await _service.GetByIdAsync(id, ownerId);
        if (slot == null) return NotFound();
        return Ok(slot);
    }

    [HttpGet("field/{fieldId}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetByFieldId(int fieldId)
    {
        var ownerId = GetOwnerId();
        var slots = await _service.GetByFieldIdAsync(fieldId, ownerId);
        return Ok(slots);
    }
    // tạo
    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Create([FromBody] TimeSlotDTO dto)
    {
        var ownerId = GetOwnerId();
        var slot = await _service.CreateAsync(dto, ownerId);
        return CreatedAtAction(nameof(GetById), new { id = slot.SlotId }, slot);
    }
    // sửa
    [HttpPut("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Update(int id, [FromBody] TimeSlotDTO dto)
    {
        var ownerId = GetOwnerId();
        var slot = await _service.UpdateAsync(id, dto, ownerId);

        if (slot == null)
            return NotFound(new { message = "Không tìm thấy slot." });

        return Ok(slot);
    }
    // xóa
    [HttpDelete("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Delete(int id)
    {
        var ownerId = GetOwnerId();
        var result = await _service.DeleteAsync(id, ownerId);

        if (!result)
            return NotFound();

        return NoContent();
    }
}
