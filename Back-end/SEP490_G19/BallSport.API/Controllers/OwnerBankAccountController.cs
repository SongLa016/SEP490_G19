using BallSport.Application.DTOs;
using BallSport.Application.Services;
using BallSport.Infrastructure.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OwnerBankAccountController : ControllerBase
    {
        private readonly OwnerBankAccountService ownerBankAccountService;

        public OwnerBankAccountController(OwnerBankAccountService ownerBankAccountService)
        {
            this.ownerBankAccountService = ownerBankAccountService;
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] OwnerBankAccountCreateDto dto)
        {
            var account = new OwnerBankAccount
            {
                OwnerId = dto.OwnerId,
                BankName = dto.BankName,
                BankShortCode = dto.BankShortCode,
                AccountNumber = dto.AccountNumber,
                AccountHolder = dto.AccountHolder,
                IsDefault = dto.IsDefault
            };

            await ownerBankAccountService.AddOwnerBankAccountAsync(account);

            return Ok(new { message = "Bank account added successfully", data = account });
        }

        [HttpGet("{ownerId}")]
        public IActionResult GetByOwner(int ownerId)
        {
            var accounts = ownerBankAccountService.GetAccountsByOwner(ownerId);
            return Ok(accounts);
        }

        // Cập nhật tài khoản ngân hàng
        [HttpPut("{bankAccountId}")]
        public async Task<IActionResult> Update(int bankAccountId, [FromBody] OwnerBankAccountCreateDto dto)
        {
            var account = new OwnerBankAccount
            {
                BankAccountId = bankAccountId,
                OwnerId = dto.OwnerId,
                BankName = dto.BankName,
                BankShortCode = dto.BankShortCode,
                AccountNumber = dto.AccountNumber,
                AccountHolder = dto.AccountHolder,
                IsDefault = dto.IsDefault
            };

            await ownerBankAccountService.UpdateOwnerBankAccountAsync(account);
            return Ok(new { message = "Bank account updated successfully", data = account });
        }

        [HttpDelete("{bankAccountId}")]
        public async Task<IActionResult> Delete(int bankAccountId)
        {
            var success = await ownerBankAccountService.DeleteOwnerBankAccountAsync(bankAccountId);
            if (!success) return NotFound(new { message = "Bank account not found" });

            return Ok(new { message = "Bank account deleted successfully" });
        }


    }

}
