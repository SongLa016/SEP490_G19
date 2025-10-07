using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FieldTypeController : ControllerBase
    {
        private readonly FieldTypeService _service;

        public FieldTypeController(FieldTypeService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> AddFieldType([FromBody] FieldTypeDTO dto)
        {
            var created = await _service.AddFieldTypeAsync(dto);
            return Ok(created);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllFieldTypesAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetFieldTypeByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }
    }
}
