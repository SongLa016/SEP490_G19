using BallSport.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var ownerId = GetOwnerId();
        var schedules = await _service.GetAllAsync(ownerId);
        return Ok(schedules);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ownerId = GetOwnerId();
        var schedule = await _service.GetByIdAsync(id, ownerId);
        if (schedule == null) return NotFound();
        return Ok(schedule);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FieldScheduleDTO dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var schedule = await _service.AddAsync(dto, ownerId);
            return CreatedAtAction(nameof(GetById), new { id = schedule.ScheduleId }, schedule);
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

    [HttpPut("{id}")]
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

    [HttpDelete("{id}")]
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
