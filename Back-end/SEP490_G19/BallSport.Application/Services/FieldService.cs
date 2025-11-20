using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace BallSport.Application.Services
{
    public class FieldService
    {
        private readonly FieldRepository _fieldRepository;
        private readonly OwnerBankAccountRepository _bankAccountRepository;

        public FieldService(FieldRepository fieldRepository, OwnerBankAccountRepository bankAccountRepository)
        {
            _fieldRepository = fieldRepository;
            _bankAccountRepository = bankAccountRepository;
        }

        // 🏟️ CREATE sân + tài khoản ngân hàng
        public async Task<FieldResponseDTO> AddFieldAsync(FieldDTO dto, int ownerId)
        {
            int? bankAccountId = null;

            // 1️⃣ Tạo tài khoản ngân hàng nếu có
            if (!string.IsNullOrEmpty(dto.BankName) &&
                !string.IsNullOrEmpty(dto.AccountNumber) &&
                !string.IsNullOrEmpty(dto.AccountHolder))
            {
                var bankAccount = new OwnerBankAccount
                {
                    OwnerId = ownerId,
                    BankName = dto.BankName,
                    BankShortCode = dto.BankShortCode,
                    AccountNumber = dto.AccountNumber,
                    AccountHolder = dto.AccountHolder,
                    IsDefault = true
                };
                await _bankAccountRepository.AddOwnerBankAccountAsync(bankAccount);
                bankAccountId = bankAccount.BankAccountId;
            }
            // 2️⃣ Tạo Field
            var field = new Field
            {
                ComplexId = dto.ComplexId,
                TypeId = dto.TypeId,
                Name = dto.Name,
                Size = dto.Size,
                GrassType = dto.GrassType,
                Description = dto.Description,
                PricePerHour = dto.PricePerHour,
                Status = dto.Status ?? "Available",
                CreatedAt = DateTime.Now,
                BankAccountId = bankAccountId
            };

            // 2a️⃣ Lưu ảnh chính (MainImage)
            if (dto.MainImage != null && dto.MainImage.Length > 0)
            {
                using var ms = new MemoryStream();
                await dto.MainImage.CopyToAsync(ms);
                field.Image = ms.ToArray();
            }

            var created = await _fieldRepository.AddFieldAsync(field);

            // 3️⃣ Lưu ảnh phụ (ImageFiles) nếu có
            if (dto.ImageFiles != null && dto.ImageFiles.Count > 0)
            {
                var imageBytesList = new List<byte[]>();
                foreach (var file in dto.ImageFiles)
                {
                    if (file.Length > 0)
                    {
                        using var ms = new MemoryStream();
                        await file.CopyToAsync(ms);
                        imageBytesList.Add(ms.ToArray());
                    }
                }

                if (imageBytesList.Count > 0)
                {
                    await _fieldRepository.AddFieldImagesAsync(created.FieldId, imageBytesList);
                }
            }

            // 4️⃣ Trả về DTO
            return new FieldResponseDTO
            {
                FieldId = created.FieldId,
                ComplexId = created.ComplexId,
                TypeId = created.TypeId,
                Name = created.Name,
                Size = created.Size,
                GrassType = created.GrassType,
                Description = created.Description,
                PricePerHour = created.PricePerHour,
                Status = created.Status,
                CreatedAt = created.CreatedAt,

                BankAccountId = created.BankAccountId, // chỉ trả BankAccountId

                MainImageBase64 = created.Image != null ? Convert.ToBase64String(created.Image) : null,
                ImageFilesBase64 = created.FieldImages?.Select(f => Convert.ToBase64String(f.Image)).ToList()
            };
        }

        // 🔄 UPDATE sân + ảnh
        public async Task<FieldResponseDTO?> UpdateFieldAsync(FieldDTO dto)
        {
            var existingField = await _fieldRepository.GetFieldByIdAsync(dto.FieldId);
            if (existingField == null) return null;

            // Cập nhật thông tin cơ bản
            existingField.Name = dto.Name;
            existingField.Size = dto.Size;
            existingField.GrassType = dto.GrassType;
            existingField.Description = dto.Description;
            existingField.TypeId = dto.TypeId;
            existingField.PricePerHour = dto.PricePerHour;
            existingField.Status = dto.Status;

            // 1️⃣ Cập nhật ảnh chính nếu có
            if (dto.MainImage != null && dto.MainImage.Length > 0)
            {
                using var ms = new MemoryStream();
                await dto.MainImage.CopyToAsync(ms);
                existingField.Image = ms.ToArray();
            }

            // 2️⃣ Cập nhật ảnh phụ nếu có
            if (dto.ImageFiles != null && dto.ImageFiles.Count > 0)
            {
                var imageBytesList = new List<byte[]>();
                foreach (var file in dto.ImageFiles)
                {
                    if (file.Length > 0)
                    {
                        using var ms = new MemoryStream();
                        await file.CopyToAsync(ms);
                        imageBytesList.Add(ms.ToArray());
                    }
                }

                if (imageBytesList.Count > 0)
                {
                    await _fieldRepository.AddFieldImagesAsync(existingField.FieldId, imageBytesList);
                }
            }

            // Lưu thay đổi
            var updated = await _fieldRepository.UpdateFieldAsync(existingField);

            // Trả về DTO
            return new FieldResponseDTO
            {
                FieldId = updated.FieldId,
                ComplexId = updated.ComplexId,
                TypeId = updated.TypeId,
                Name = updated.Name,
                Size = updated.Size,
                GrassType = updated.GrassType,
                Description = updated.Description,
                PricePerHour = updated.PricePerHour,
                Status = updated.Status,
                CreatedAt = updated.CreatedAt,

                BankAccountId = updated.BankAccountId, // chỉ trả BankAccountId

                MainImageBase64 = updated.Image != null ? Convert.ToBase64String(updated.Image) : null,
                ImageFilesBase64 = updated.FieldImages?.Select(f => Convert.ToBase64String(f.Image)).ToList()
            };
        }

        // 🧾 Lấy tất cả sân theo ComplexId
        public async Task<List<FieldResponseDTO>> GetFieldsByComplexIdAsync(int complexId)
        {
            var fields = await _fieldRepository.GetFieldsByComplexIdAsync(complexId);

            return fields.Select(f => new FieldResponseDTO
            {
                FieldId = f.FieldId,
                ComplexId = f.ComplexId,
                TypeId = f.TypeId,
                Name = f.Name,
                Size = f.Size,
                GrassType = f.GrassType,
                Description = f.Description,
                PricePerHour = f.PricePerHour,
                Status = f.Status,
                CreatedAt = f.CreatedAt,
                BankAccountId = f.BankAccountId,
                // ảnh chính
                MainImageBase64 = f.Image != null
                    ? Convert.ToBase64String(f.Image)
                    : null,

                // ảnh phụ
                ImageFilesBase64 = f.FieldImages != null
                    ? f.FieldImages.Select(img => Convert.ToBase64String(img.Image)).ToList()
                    : new List<string>()
            }).ToList();
        }


        // 🔍 Lấy chi tiết 1 sân
        public async Task<FieldResponseDTO?> GetFieldByIdAsync(int fieldId)
        {
            var f = await _fieldRepository.GetFieldByIdAsync(fieldId);
            if (f == null) return null;

            return new FieldResponseDTO
            {
                FieldId = f.FieldId,
                ComplexId = f.ComplexId,
                TypeId = f.TypeId,
                Name = f.Name,
                Size = f.Size,
                GrassType = f.GrassType,
                Description = f.Description,
                PricePerHour = f.PricePerHour,
                Status = f.Status,
                CreatedAt = f.CreatedAt,
                BankAccountId = f.BankAccountId,

                // ảnh chính
                MainImageBase64 = f.Image != null ? Convert.ToBase64String(f.Image) : null,

                // ảnh phụ
                ImageFilesBase64 = f.FieldImages?
                    .Select(img => Convert.ToBase64String(img.Image))
                    .ToList()
            };
        }
        public async Task<List<FieldResponseDTO>> GetFieldsByOwnerIdAsync(int ownerId)
        {
            var fields = await _fieldRepository.GetFieldsByOwnerIdAsync(ownerId);

            return fields.Select(f => new FieldResponseDTO
            {
                FieldId = f.FieldId,
                ComplexId = f.ComplexId,
                TypeId = f.TypeId,
                Name = f.Name,
                Size = f.Size,
                GrassType = f.GrassType,
                Description = f.Description,
                PricePerHour = f.PricePerHour,
                Status = f.Status,
                CreatedAt = f.CreatedAt,
                BankAccountId = f.BankAccountId,
                MainImageBase64 = f.Image != null ? Convert.ToBase64String(f.Image) : null,
                ImageFilesBase64 = f.FieldImages?.Select(img => Convert.ToBase64String(img.Image)).ToList()
            }).ToList();
        }


        // ❌ DELETE sân
        public async Task<bool> DeleteFieldAsync(int fieldId)
        {
            var existingField = await _fieldRepository.GetFieldByIdAsync(fieldId);
            if (existingField == null) return false;

            return await _fieldRepository.DeleteFieldAsync(fieldId);
        }
    }
}
