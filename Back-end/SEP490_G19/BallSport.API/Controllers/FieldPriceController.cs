using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BallSport.Application.DTOs;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FieldPriceController : ControllerBase
{
    private readonly IFieldPriceService _service;

    public FieldPriceController(IFieldPriceService service)
    {
        _service = service;
    }

    private int GetOwnerId()
    {
        var ownerIdClaim = User.FindFirst("UserID");
        if (ownerIdClaim == null) throw new UnauthorizedAccessException("Không tìm thấy OwnerId");
        return int.Parse(ownerIdClaim.Value);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        int ownerId = GetOwnerId();
        var list = await _service.GetAllAsync(ownerId);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        int ownerId = GetOwnerId();
        var item = await _service.GetByIdAsync(ownerId, id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] FieldPriceDTO dto)
    {
        int ownerId = GetOwnerId();
        try
        {
            var added = await _service.AddAsync(ownerId, dto);

            return CreatedAtAction(nameof(GetById), new { id = added.PriceId }, added);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }


    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] FieldPriceDTO dto)
    {
        int ownerId = GetOwnerId();
        try
        {
            await _service.UpdateAsync(ownerId, id, dto);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        int ownerId = GetOwnerId();
        try
        {
            await _service.DeleteAsync(ownerId, id);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }
}
