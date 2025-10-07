using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FieldComplexController : ControllerBase
    {
        private readonly FieldComplexService _service;

        public FieldComplexController(FieldComplexService service)
        {
            _service = service;
        }

        //  Thêm khu sân mới
        [HttpPost]
        public async Task<IActionResult> AddComplex([FromBody] FieldComplexDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _service.AddComplexAsync(dto);
            return Ok(created);
        }

        // Lấy tất cả khu sân
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllComplexesAsync();
            return Ok(result);
        }

        //  Lấy chi tiết khu sân theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var complex = await _service.GetComplexByIdAsync(id);
            if (complex == null)
                return NotFound($"Không tìm thấy khu sân có ID = {id}");

            return Ok(complex);
        }
    }
}
