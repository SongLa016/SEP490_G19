using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/public")]
    public class DepositPolicyPublicController : ControllerBase
    {
        private readonly DepositPolicyService _service;

        public DepositPolicyPublicController(DepositPolicyService service)
        {
            _service = service;
        }

        // 🔓 PUBLIC - GET POLICY BY FIELD ID
        // GET: api/deposit-policies/field/69
        [HttpGet("field/{fieldId:int}")]
        public async Task<IActionResult> GetByFieldId(int fieldId)
        {
            var result = await _service.GetPublicByFieldIdAsync(fieldId);

            if (result == null)
                return NotFound("Sân này chưa có chính sách đặt cọc");

            return Ok(result);
        }
    }
}
