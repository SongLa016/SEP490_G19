using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class DepositPolicyService
    {
        private readonly DepositPolicyRepository _repo;

        public DepositPolicyService(DepositPolicyRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<DepositPolicyDTO>> GetAllAsync(int ownerId)
        {
            var list = await _repo.GetAllByOwnerAsync(ownerId);
            return list.Select(MapToDto).ToList();
        }

        public async Task<DepositPolicyDTO?> GetByFieldIdAsync(int fieldId, int ownerId)
        {
            var dp = await _repo.GetByFieldIdAsync(fieldId, ownerId);
            return dp == null ? null : MapToDto(dp);
        }

        public async Task<DepositPolicyDTO> AddAsync(DepositPolicyDTO dto, int ownerId)
        {
            await EnsureOwner(dto.FieldId, ownerId);

            var entity = new DepositPolicy
            {
                FieldId = dto.FieldId,
                DepositPercent = dto.DepositPercent,
                MinDeposit = dto.MinDeposit,
                MaxDeposit = dto.MaxDeposit,
                CreatedAt = DateTime.UtcNow
            };

            return MapToDto(await _repo.AddAsync(entity));
        }

        public async Task<bool> UpdateAsync(DepositPolicyDTO dto, int ownerId)
        {
            await EnsureOwner(dto.FieldId, ownerId);

            return await _repo.UpdateAsync(new DepositPolicy
            {
                DepositPolicyId = dto.DepositPolicyId,
                FieldId = dto.FieldId,
                DepositPercent = dto.DepositPercent,
                MinDeposit = dto.MinDeposit,
                MaxDeposit = dto.MaxDeposit
            });
        }

        public async Task<bool> DeleteAsync(int depositPolicyId, int fieldId, int ownerId)
        {
            await EnsureOwner(fieldId, ownerId);
            return await _repo.DeleteAsync(depositPolicyId);
        }

        private async Task EnsureOwner(int fieldId, int ownerId)
        {
            if (!await _repo.IsFieldOwnedByOwnerAsync(fieldId, ownerId))
                throw new UnauthorizedAccessException("Không có quyền với sân này");
        }

        private static DepositPolicyDTO MapToDto(DepositPolicy dp)
        {
            return new DepositPolicyDTO
            {
                DepositPolicyId = dp.DepositPolicyId,
                FieldId = dp.FieldId,
                DepositPercent = dp.DepositPercent,
                MinDeposit = dp.MinDeposit,
                MaxDeposit = dp.MaxDeposit,
                CreatedAt = dp.CreatedAt
            };
        }
    }

}
