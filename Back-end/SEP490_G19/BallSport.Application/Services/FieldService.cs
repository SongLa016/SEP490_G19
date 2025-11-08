using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

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
        public async Task<FieldDTO> AddFieldAsync(FieldDTO dto , int ownerId)
        {
            int? bankAccountId = null;

            // ✅ 1. Tạo tài khoản ngân hàng nếu có
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

            // ✅ 2. Chuyển file ảnh sang byte[]
            byte[]? imageData = null;
            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                using var ms = new MemoryStream();
                await dto.ImageFile.CopyToAsync(ms);
                imageData = ms.ToArray();
            }

            // ✅ 3. Tạo sân
            var field = new Field
            {
                ComplexId = dto.ComplexId,
                TypeId = dto.TypeId,
                Name = dto.Name,
                Size = dto.Size,
                GrassType = dto.GrassType,
                Description = dto.Description,
                Image = imageData, // <--- ảnh dạng byte[]
                PricePerHour = dto.PricePerHour,
                Status = dto.Status ?? "Available",
                CreatedAt = DateTime.Now,
                BankAccountId = bankAccountId
            };

            var created = await _fieldRepository.AddFieldAsync(field);

            return new FieldDTO
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
                BankName = dto.BankName,
                AccountNumber = dto.AccountNumber,
                AccountHolder = dto.AccountHolder
            };
        }


        // 🧾 Lấy tất cả sân theo ComplexID
        public async Task<List<FieldDTO>> GetFieldsByComplexIdAsync(int complexId)
        {
            var fields = await _fieldRepository.GetFieldsByComplexIdAsync(complexId);

            return fields.Select(f => new FieldDTO
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
               
            }).ToList();
        }

        // 🔍 Lấy chi tiết 1 sân
        public async Task<FieldDTO?> GetFieldByIdAsync(int fieldId)
        {
            var f = await _fieldRepository.GetFieldByIdAsync(fieldId);
            if (f == null) return null;

            return new FieldDTO
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
                
            };
        }

        // ✏️ UPDATE sân
        public async Task<FieldDTO?> UpdateFieldAsync(FieldDTO dto)
        {
            var existingField = await _fieldRepository.GetFieldByIdAsync(dto.FieldId);
            if (existingField == null) return null;

            // 🔹 Cập nhật các thuộc tính cơ bản
            existingField.Name = dto.Name;
            existingField.Size = dto.Size;
            existingField.GrassType = dto.GrassType;
            existingField.Description = dto.Description;
            existingField.TypeId = dto.TypeId;
            existingField.PricePerHour = dto.PricePerHour;
            existingField.Status = dto.Status;

            // 🔹 Xử lý upload ảnh (nếu có ảnh mới)
            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                // Tạo tên file duy nhất
                var fileName = $"{Guid.NewGuid()}_{dto.ImageFile.FileName}";
                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "fields");

                // Tạo thư mục nếu chưa tồn tại
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                // Đường dẫn lưu ảnh mới
                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ImageFile.CopyToAsync(stream);
                }


                if (dto.ImageFile != null)
                {
                    using (var ms = new MemoryStream())
                    {
                        await dto.ImageFile.CopyToAsync(ms);
                        existingField.Image = ms.ToArray();
                    }
                }
            }



            // 🔹 Lưu thay đổi vào DB
            var updated = await _fieldRepository.UpdateFieldAsync(existingField);

            // 🔹 Trả về DTO kết quả
            return new FieldDTO
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
                CreatedAt = updated.CreatedAt
              
            };
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
