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
   
}
