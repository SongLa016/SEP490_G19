using BallSport.Application.DTOs;
using BallSport.Application.Services;
using BallSport.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace BallSport.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Áp dụng cho toàn controller luôn
    public class PlayerBankAccountController : ControllerBase
    {
        private readonly PlayerBankAccountService _service;

        public PlayerBankAccountController(PlayerBankAccountService service)
        {
            _service = service;
        }

        // ✅ Sửa lại để đọc claim "UserID" cho đúng với JWT của mày
        private int GetUserId()
        {
            var userIdClaim = User.FindFirst("UserID")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("User not logged in or token invalid.");
            return int.Parse(userIdClaim);
        }

        [HttpGet]
        public async Task<ActionResult<List<PlayerBankAccountDTO>>> GetAll()
        {
            var userId = GetUserId();
            var accounts = await _service.GetByUserIdAsync(userId);

            var dtoList = accounts.Select(a => new PlayerBankAccountDTO
            {
                UserID = a.UserId,
                BankName = a.BankName,
                BankShortCode = a.BankShortCode,
                AccountNumber = a.AccountNumber,
                AccountHolder = a.AccountHolder,
                IsDefault = a.IsDefault ?? false
            }).ToList();

            return Ok(dtoList);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PlayerBankAccountDTO>> GetById(int id)
        {
            var userId = GetUserId();
            var account = await _service.GetByIdAsync(id);

            if (account == null || account.UserId != userId) return NotFound();

            var dto = new PlayerBankAccountDTO
            {
                UserID = account.UserId,
                BankName = account.BankName,
                BankShortCode = account.BankShortCode,
                AccountNumber = account.AccountNumber,
                AccountHolder = account.AccountHolder,
                IsDefault = account.IsDefault ?? false
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<PlayerBankAccountDTO>> Create([FromBody] PlayerBankAccountDTO dto)
        {
            // ✅ Lấy UserID từ token, không cần nhập tay
            dto.UserID = GetUserId();

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

            dto.UserID = created.UserId;
            return CreatedAtAction(nameof(GetById), new { id = created.BankAccountId }, dto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<PlayerBankAccountDTO>> Update(int id, [FromBody] PlayerBankAccountDTO dto)
        {
            var userId = GetUserId();
            var account = await _service.GetByIdAsync(id);

            if (account == null || account.UserId != userId) return NotFound();

            account.BankName = dto.BankName;
            account.BankShortCode = dto.BankShortCode;
            account.AccountNumber = dto.AccountNumber;
            account.AccountHolder = dto.AccountHolder;
            account.IsDefault = dto.IsDefault;

            var updated = await _service.UpdateAccountAsync(account);

            dto.UserID = updated!.UserId;
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            var account = await _service.GetByIdAsync(id);

            if (account == null || account.UserId != userId) return NotFound();

            await _service.DeleteAccountAsync(id);
            return NoContent();
        }
    }
}
