using BallSport.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class FieldScheduleController : ControllerBase
{
    private readonly IFieldScheduleService _service;

    public FieldScheduleController(IFieldScheduleService service)
    {
        _service = service;
    }

    private int GetOwnerId()
    {
        var claim = User.FindFirst("UserID");
        if (claim == null) throw new UnauthorizedAccessException("Không tìm thấy OwnerId trong token.");
        return int.Parse(claim.Value);
    }


    /// Lấy toàn bộ lịch sân (Player xem)
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllPublic()
    {
        var schedules = await _service.GetPublicAllAsync();
        return Ok(schedules);
    }

    /// Lấy lịch của 1 sân cụ thể (Player xem)
    [HttpGet("public/field/{fieldId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByFieldPublic(int fieldId)
    {
        var schedules = await _service.GetPublicByFieldAsync(fieldId);
        return Ok(schedules);
    }

    /// Lấy chi tiết 1 lịch theo ID (public)
    [HttpGet("public/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicById(int id)
    {
        var schedule = await _service.GetPublicByIdAsync(id);
        if (schedule == null) return NotFound();
        return Ok(schedule);
    }

    // 2) OWNER API

    /// Lấy toàn bộ lịch của owner
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllOwner()
    {
        var ownerId = GetOwnerId();
        var schedules = await _service.GetAllAsync(ownerId);
        return Ok(schedules);
    }

    /// Lấy chi tiết lịch theo ID (chỉ owner)
    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetByIdOwner(int id)
    {
        var ownerId = GetOwnerId();
        var schedule = await _service.GetByIdAsync(id, ownerId);
        if (schedule == null) return NotFound();
        return Ok(schedule);
    }

    /// Tạo lịch mới (only owner)
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] FieldScheduleDTO dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var schedule = await _service.AddAsync(dto, ownerId);
            return CreatedAtAction(nameof(GetByIdOwner), new { id = schedule.ScheduleId }, schedule);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// Update lịch (only owner)
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] FieldScheduleDTO dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var schedule = await _service.UpdateAsync(id, dto, ownerId);
            if (schedule == null) return NotFound();
            return Ok(schedule);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// Xoá lịch (only owner)
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var ownerId = GetOwnerId();
            var result = await _service.DeleteAsync(id, ownerId);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
