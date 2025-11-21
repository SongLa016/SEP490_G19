using BallSport.Application.DTOs;
using BallSport.Application.Services;
using BallSport.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BallSport.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayerBankAccountController : ControllerBase
    {
        private readonly PlayerBankAccountService _service;

        public PlayerBankAccountController(PlayerBankAccountService service)
        {
            _service = service;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUserId(int userId)
        {
            if (userId <= 0) return BadRequest("Invalid user ID");

            var accounts = await _service.GetByUserIdAsync(userId);
            return Ok(accounts);
        }

        [HttpGet("{bankAccountId}")]
        public async Task<IActionResult> GetById(int bankAccountId)
        {
            if (bankAccountId <= 0) return BadRequest("Invalid bank account ID");

            var account = await _service.GetByIdAsync(bankAccountId);
            if (account == null) return NotFound("Bank account not found");

            return Ok(account);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] PlayerBankAccountDTO dto)
        {
            if (dto == null) return BadRequest("Invalid account data");

            var entity = new PlayerBankAccount
            {
                UserId = dto.UserID,
                BankName = dto.BankName,
                BankShortCode = dto.BankShortCode,
                AccountNumber = dto.AccountNumber,
                AccountHolder = dto.AccountHolder,
                IsDefault = dto.IsDefault
            };

            var created = await _service.AddAccountAsync(entity);
            return Ok(new
            {
                Message = "Bank account created successfully",
                Data = created
            });
        }

        [HttpPut("update/{bankAccountId}")]
        public async Task<IActionResult> Update(int bankAccountId, [FromBody] PlayerBankAccountDTO dto)
        {
            if (bankAccountId <= 0 || dto == null) return BadRequest("Invalid data");

            var entity = new PlayerBankAccount
            {
                BankAccountId = bankAccountId,
                UserId = dto.UserID,
                BankName = dto.BankName,
                BankShortCode = dto.BankShortCode,
                AccountNumber = dto.AccountNumber,
                AccountHolder = dto.AccountHolder,
                IsDefault = dto.IsDefault
            };

            var updated = await _service.UpdateAccountAsync(entity);
            if (updated == null) return NotFound("Bank account not found");

            return Ok(new
            {
                Message = "Bank account updated successfully",
                Data = updated
            });
        }

        [HttpDelete("delete/{bankAccountId}")]
        public async Task<IActionResult> Delete(int bankAccountId)
        {
            if (bankAccountId <= 0) return BadRequest("Invalid bank account ID");

            var success = await _service.DeleteAccountAsync(bankAccountId);
            if (!success) return NotFound("Bank account not found");

            return Ok(new { Message = "Bank account deleted successfully" });
        }
    }
}
