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

        //  Upload ảnh lên Cloudinary
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

        public async Task<FieldComplex?> GetComplexByIdAsync(int complexId)
        {
            return await _fieldRepository.GetComplexByIdAsync(complexId);
        }

        //thêm
        public async Task<FieldResponseDTO> AddFieldAsync(FieldDTO dto, int ownerId)
        {
            if (dto.ComplexId == null)
                throw new ArgumentException("ComplexId không được null.");

            var complex = await _fieldRepository.GetComplexByIdAsync(dto.ComplexId.Value);
            if (complex == null)
                throw new ArgumentException($"ComplexId = {dto.ComplexId} không tồn tại.");

            if (complex.OwnerId != ownerId)
                throw new UnauthorizedAccessException("Chỉ Owner của Complex mới được thêm sân.");

            // Bank account
            if (dto.BankAccountId == null)
                throw new ArgumentException("BankAccountId không được null.");

            var bank = await _bankAccountRepository.GetByIdAsync(dto.BankAccountId.Value);
            if (bank == null || bank.OwnerId != ownerId)
                throw new UnauthorizedAccessException("BankAccount không hợp lệ hoặc không thuộc Owner này.");
            if(dto.PricePerHour < 0)
            {
                throw new ArgumentException("Giá sân phải lớn hơn 0 ");
            }
            // Upload main image
            string? mainImageUrl = null;
            if (dto.MainImage != null)
                mainImageUrl = await UploadToCloudinary(dto.MainImage);

            var field = new Field
            {
                ComplexId = dto.ComplexId,
                TypeId = dto.TypeId,
                Name = dto.Name,
                Size = dto.Size,
                GrassType = dto.GrassType,
                Description = dto.Description,
                PricePerHour = dto.PricePerHour ?? 0,
                Status = string.IsNullOrEmpty(dto.Status) ? "Available" : dto.Status,
                CreatedAt = DateTime.Now,
                BankAccountId = dto.BankAccountId,
                ImageUrl = mainImageUrl
            };

            var created = await _fieldRepository.AddFieldAsync(field);

            // đọc ảnh
            var extraUrls = new List<string>();
            if (dto.ImageFiles != null)
            {
                foreach (var img in dto.ImageFiles)
                {
                    var url = await UploadToCloudinary(img);
                    if (!string.IsNullOrEmpty(url)) extraUrls.Add(url);
                }
                if (extraUrls.Count > 0)
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
                BankAccountId = created.BankAccountId ?? 0,
                MainImageUrl = created.ImageUrl,
                ImageUrls = extraUrls
            };
        }
        // sửa
        public async Task<FieldResponseDTO?> UpdateFieldAsync(FieldDTO dto, int ownerId)
        {
            var field = await _fieldRepository.GetFieldByIdAsync(dto.FieldId);
            if (field == null) return null;

            // check token 
            if (field.ComplexId == null)
                throw new UnauthorizedAccessException("Field không thuộc Complex nào.");

            var complex = await _fieldRepository.GetComplexByIdAsync(field.ComplexId.Value);
            if (complex == null || complex.OwnerId != ownerId)
                throw new UnauthorizedAccessException("Bạn không có quyền sửa field này.");
            // check bank
            if (dto.BankAccountId != null)
            {
                var bank = await _bankAccountRepository.GetByIdAsync(dto.BankAccountId.Value);
                if (bank == null || bank.OwnerId != ownerId)
                    throw new UnauthorizedAccessException("BankAccount không hợp lệ hoặc không thuộc Owner này.");

                field.BankAccountId = dto.BankAccountId;
            }
           
            field.Name = dto.Name;
            field.Size = dto.Size;
            field.GrassType = dto.GrassType;
            field.Description = dto.Description;
            field.TypeId = dto.TypeId;
            field.PricePerHour = dto.PricePerHour;
            field.Status = dto.Status ?? field.Status;
            field.BankAccountId = dto.BankAccountId;            
            // ảnh chính
            if (dto.MainImage != null)
            {
                var mainUrl = await UploadToCloudinary(dto.MainImage);
                if (!string.IsNullOrEmpty(mainUrl)) field.ImageUrl = mainUrl;
            }

            // update xóa ảnh cũ
            if (dto.ImageFiles != null && dto.ImageFiles.Any())
            {
                var extraUrls = new List<string>();
                foreach (var img in dto.ImageFiles)
                {
                    var url = await UploadToCloudinary(img);
                    if (!string.IsNullOrEmpty(url)) extraUrls.Add(url);
                }

                if (extraUrls.Any())
                    await _fieldRepository.ReplaceFieldImagesAsync(field.FieldId, extraUrls); 
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
                BankAccountId = updated.BankAccountId ?? 0,
                MainImageUrl = updated.ImageUrl,
                ImageUrls = updated.FieldImages?.Select(x => x.ImageUrl).ToList() ?? new List<string>()
            };
        }

        //  lấy ra theo field id

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


        //  lấy theo khu sân

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

        // lấy ra sân của owner
       
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

        // xóa

        public async Task<bool> DeleteFieldAsync(int fieldId, int ownerId)
        {
            var field = await _fieldRepository.GetFieldByIdAsync(fieldId);
            if (field == null) return false;

            var complex = await _fieldRepository.GetComplexByIdAsync(field.ComplexId ?? 0);
            if (complex == null || complex.OwnerId != ownerId)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa field này.");

            return await _fieldRepository.DeleteFieldAsync(fieldId);
        }
    }
}
