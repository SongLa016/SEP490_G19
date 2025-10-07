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

        //  Lấy tất cả chính sách đặt cọc
        public async Task<List<DepositPolicyDTO>> GetAllAsync()
        {
            var list = await _repo.GetAllAsync();
            return list.Select(dp => new DepositPolicyDTO
            {
                DepositPolicyId = dp.DepositPolicyId,
                FieldId = dp.FieldId,
                FieldName = dp.Field?.Name,
                DepositPercent = dp.DepositPercent,
                MinDeposit = dp.MinDeposit,
                MaxDeposit = dp.MaxDeposit,
                CreatedAt = dp.CreatedAt
            }).ToList();
        }

        //  Lấy chính sách theo sân
        public async Task<DepositPolicyDTO?> GetByFieldIdAsync(int fieldId)
        {
            var dp = await _repo.GetByFieldIdAsync(fieldId);
            if (dp == null) return null;

            return new DepositPolicyDTO
            {
                DepositPolicyId = dp.DepositPolicyId,
                FieldId = dp.FieldId,
                FieldName = dp.Field?.Name,
                DepositPercent = dp.DepositPercent,
                MinDeposit = dp.MinDeposit,
                MaxDeposit = dp.MaxDeposit,
                CreatedAt = dp.CreatedAt
            };
        }

        //  Thêm mới
        public async Task<DepositPolicyDTO> AddAsync(DepositPolicyDTO dto)
        {
            var entity = new DepositPolicy
            {
                FieldId = dto.FieldId,
                DepositPercent = dto.DepositPercent,
                MinDeposit = dto.MinDeposit,
                MaxDeposit = dto.MaxDeposit,
                CreatedAt = DateTime.Now
            };

            var added = await _repo.AddAsync(entity);
            return new DepositPolicyDTO
            {
                DepositPolicyId = added.DepositPolicyId,
                FieldId = added.FieldId,
                DepositPercent = added.DepositPercent,
                MinDeposit = added.MinDeposit,
                MaxDeposit = added.MaxDeposit,
                CreatedAt = added.CreatedAt
            };
        }

        //  Cập nhật
        public async Task<bool> UpdateAsync(DepositPolicyDTO dto)
        {
            var entity = new DepositPolicy
            {
                DepositPolicyId = dto.DepositPolicyId,
                FieldId = dto.FieldId,
                DepositPercent = dto.DepositPercent,
                MinDeposit = dto.MinDeposit,
                MaxDeposit = dto.MaxDeposit
            };

            return await _repo.UpdateAsync(entity);
        }

        //  Xóa
        public async Task<bool> DeleteAsync(int id)
        {
            return await _repo.DeleteAsync(id);
        }
    }
}
