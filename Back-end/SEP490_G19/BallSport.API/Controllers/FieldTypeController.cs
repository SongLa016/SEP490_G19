using BallSport.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class FieldTypeController : ControllerBase
{
    private readonly IFieldTypeService _service;

    public FieldTypeController(IFieldTypeService service)
    {
        _service = service;
    }

    private int GetOwnerId() =>
        int.Parse(User.FindFirst("UserID")?.Value ?? throw new Exception("OwnerId không tìm thấy"));

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ft = await _service.GetByIdAsync(id);
        if (ft == null) return NotFound();
        return Ok(ft);
    }
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FieldTypeDTO dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var ft = await _service.CreateAsync(dto, ownerId);
            return CreatedAtAction(nameof(GetById), new { id = ft.TypeId }, ft);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] FieldTypeDTO dto)
    {
        try
        {
            var ownerId = GetOwnerId();
            var ft = await _service.UpdateAsync(id, dto, ownerId);
            if (ft == null) return NotFound();
            return Ok(ft);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var ownerId = GetOwnerId();
            await _service.DeleteAsync(id, ownerId);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}
