using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;

namespace BallSport.Application.Services
{
    public class FieldService
    {
        private readonly FieldRepository _fieldRepository;
        private readonly OwnerBankAccountRepository _bankAccountRepository;
        private readonly Cloudinary _cloudinary;

        public FieldService(FieldRepository fieldRepository,
                            OwnerBankAccountRepository bankAccountRepository,
                            Cloudinary cloudinary)
        {
            _fieldRepository = fieldRepository;
            _bankAccountRepository = bankAccountRepository;
            _cloudinary = cloudinary;
        }

        // =======================
        // 📌 Upload ảnh lên Cloudinary
        // =======================
        private async Task<string?> UploadToCloudinary(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, file.OpenReadStream()),
                Folder = "ballsport/fields"
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            return uploadResult.SecureUrl?.ToString();
        }

        // =======================
        // 🏟️ CREATE FIELD
        // =======================
        public async Task<FieldResponseDTO> AddFieldAsync(FieldDTO dto, int ownerId)
        {
            int? bankAccountId = null;

            // bank account
            if (!string.IsNullOrEmpty(dto.BankName) &&
                !string.IsNullOrEmpty(dto.AccountNumber) &&
                !string.IsNullOrEmpty(dto.AccountHolder))
            {
                var bank = new OwnerBankAccount
                {
                    OwnerId = ownerId,
                    BankName = dto.BankName,
                    BankShortCode = dto.BankShortCode,
                    AccountNumber = dto.AccountNumber,
                    AccountHolder = dto.AccountHolder,
                    IsDefault = true
                };

                await _bankAccountRepository.AddOwnerBankAccountAsync(bank);
                bankAccountId = bank.BankAccountId;
            }

            // main image
            string? mainImageUrl = null;
            if (dto.MainImage != null)
                mainImageUrl = await UploadToCloudinary(dto.MainImage);

            // create field
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
                BankAccountId = bankAccountId,
                ImageUrl = mainImageUrl
            };

            var created = await _fieldRepository.AddFieldAsync(field);

            // extra images
            var extraUrls = new List<string>();

            if (dto.ImageFiles != null)
            {
                foreach (var img in dto.ImageFiles)
                {
                    var url = await UploadToCloudinary(img);
                    if (url != null) extraUrls.Add(url);
                }

                await _fieldRepository.AddFieldImagesAsync(created.FieldId, extraUrls);
            }

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
                BankAccountId = created.BankAccountId,
                MainImageUrl = created.ImageUrl,
                ImageUrls = extraUrls
            };
        }

        // =======================
        // 🔄 UPDATE FIELD
        // =======================
        public async Task<FieldResponseDTO?> UpdateFieldAsync(FieldDTO dto)
        {
            var field = await _fieldRepository.GetFieldByIdAsync(dto.FieldId);
            if (field == null) return null;

            field.Name = dto.Name;
            field.Size = dto.Size;
            field.GrassType = dto.GrassType;
            field.Description = dto.Description;
            field.TypeId = dto.TypeId;
            field.PricePerHour = dto.PricePerHour;
            field.Status = dto.Status;

            // main image
            if (dto.MainImage != null)
            {
                var url = await UploadToCloudinary(dto.MainImage);
                if (url != null) field.ImageUrl = url;
            }

            // extra images
            var extraUrls = new List<string>();
            if (dto.ImageFiles != null)
            {
                foreach (var img in dto.ImageFiles)
                {
                    var url = await UploadToCloudinary(img);
                    if (url != null) extraUrls.Add(url);
                }

                await _fieldRepository.AddFieldImagesAsync(field.FieldId, extraUrls);
            }

            var updated = await _fieldRepository.UpdateFieldAsync(field);

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
                BankAccountId = updated.BankAccountId,
                MainImageUrl = updated.ImageUrl,
                ImageUrls = updated.FieldImages?.Select(x => x.ImageUrl).ToList()
            };
        }

        // =======================
        // 🔍 GET FIELD BY ID
        // =======================
        public async Task<FieldResponseDTO?> GetFieldByIdAsync(int id)
        {
            var f = await _fieldRepository.GetFieldByIdAsync(id);
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
                MainImageUrl = f.ImageUrl,
                ImageUrls = f.FieldImages?.Select(x => x.ImageUrl).ToList()
            };
        }

        // =======================
        // 🔍 GET FIELDS BY COMPLEX
        // =======================
        public async Task<List<FieldResponseDTO>> GetFieldsByComplexIdAsync(int complexId)
        {
            var list = await _fieldRepository.GetFieldsByComplexIdAsync(complexId);

            return list.Select(f => new FieldResponseDTO
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
                MainImageUrl = f.ImageUrl,
                ImageUrls = f.FieldImages.Select(img => img.ImageUrl).ToList()
            }).ToList();
        }

        // =======================
        // 🔍 GET FIELDS BY OWNER
        // =======================
        public async Task<List<FieldResponseDTO>> GetFieldsByOwnerIdAsync(int ownerId)
        {
            var list = await _fieldRepository.GetFieldsByOwnerIdAsync(ownerId);

            return list.Select(f => new FieldResponseDTO
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
                MainImageUrl = f.ImageUrl,
                ImageUrls = f.FieldImages.Select(img => img.ImageUrl).ToList()
            }).ToList();
        }

        // =======================
        // ❌ DELETE FIELD
        // =======================
        public async Task<bool> DeleteFieldAsync(int fieldId)
        {
            return await _fieldRepository.DeleteFieldAsync(fieldId);
        }
    }
}
