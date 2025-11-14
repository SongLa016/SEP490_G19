using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeSlotController : ControllerBase
{
    private readonly ITimeSlotService _service;

    public TimeSlotController(ITimeSlotService service)
    {
        _service = service;
    }

    private int GetOwnerId()
    {
        var ownerIdClaim = User.FindFirst("UserID");
        if (ownerIdClaim == null) throw new UnauthorizedAccessException("Không tìm thấy OwnerId trong token.");
        return int.Parse(ownerIdClaim.Value);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var ownerId = GetOwnerId();
        var slots = await _service.GetAllAsync(ownerId);
        return Ok(slots);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ownerId = GetOwnerId();
        var slot = await _service.GetByIdAsync(id, ownerId);
        if (slot == null) return NotFound();
        return Ok(slot);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TimeSlotDTO dto)
    {
        var ownerId = GetOwnerId();
        var slot = await _service.CreateAsync(dto, ownerId);
        return CreatedAtAction(nameof(GetById), new { id = slot.SlotId }, slot);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TimeSlotDTO dto)
    {
        var ownerId = GetOwnerId();
        var slot = await _service.UpdateAsync(id, dto, ownerId);
        if (slot == null) return NotFound();
        return Ok(slot);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ownerId = GetOwnerId();
        var result = await _service.DeleteAsync(id, ownerId);
        if (!result) return NotFound();
        return NoContent();
    }
}
