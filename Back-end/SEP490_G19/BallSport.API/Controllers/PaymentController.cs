using BallSport.Application.DTOs;
using BallSport.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentController(PaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentCreateDto dto)
        {
            try
            {
                var payment = await _paymentService.CreatePaymentAsync(dto);
                return Ok(new { success = true, data = payment });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("confirm/{orderCode}")]
        public async Task<IActionResult> ConfirmPayment(string orderCode, [FromQuery] string status, [FromQuery] string checksum)
        {
            try
            {
                var success = await _paymentService.ConfirmPaymentAsync(orderCode, status, checksum);
                if (!success)
                    return BadRequest(new { success = false, message = "Không tìm thấy giao dịch hoặc đã xác nhận rồi" });

                return Ok(new { success = true, message = "Thanh toán thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
        [HttpPost("callback")]
        public async Task<IActionResult> PayOSCallback([FromBody] dynamic data)
        {
            try
            {
                string orderCode = data["data"]?["orderCode"];
                string transactionStatus = data["data"]?["transactionStatus"];
                string checksum = data["signature"]; // PayOS thường trả về "signature" hoặc "checksum"

                bool success = await _paymentService.ConfirmPaymentAsync(orderCode, transactionStatus, checksum);

                if (success)
                    return Ok(new { message = "Payment confirmed" });

                return BadRequest(new { message = "Invalid transaction status" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

    }
}
