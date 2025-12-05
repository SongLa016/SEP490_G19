using BallSport.Application.DTOs;
using BallSport.Application.Services.Geocoding;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;

namespace BallSport.Application.Services
{
    public class FieldComplexService
    {
        private readonly FieldComplexRepository _complexRepository;
        private readonly Cloudinary _cloudinary;
        private readonly ITheIpApiService _ipService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public FieldComplexService(
            FieldComplexRepository complexRepository,
            Cloudinary cloudinary,
            ITheIpApiService ipService,
            IHttpContextAccessor httpContextAccessor)
        {
            _complexRepository = complexRepository;
            _cloudinary = cloudinary;
            _ipService = ipService;
            _httpContextAccessor = httpContextAccessor;
        }

        // =========================
        // ✅ HÀM LẤY IP CHUẨN SẢN PHẨM
        // =========================
        private string? GetClientIp()
        {
            var context = _httpContextAccessor.HttpContext;

            var ip = context?.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                  ?? context?.Connection.RemoteIpAddress?.ToString();

            if (ip == "::1") return null;
            if (ip == "127.0.0.1") return null;

            return ip;
        }


        // =========================
        // ✅ ADD COMPLEX
        // =========================
        public async Task<FieldComplexResponseDTO> AddComplexAsync(FieldComplexDTO dto)
        {
            string? imageUrl = null;

            // ✅ Upload ảnh Cloudinary
            if (dto.ImageFile != null)
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(dto.ImageFile.FileName, dto.ImageFile.OpenReadStream()),
                    Folder = "field-complexes"
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                imageUrl = uploadResult.SecureUrl.AbsoluteUri;
            }

            // ✅ LẤY TỌA ĐỘ TỪ IP
            double? latitude = null;
            double? longitude = null;

            string? ipAddress = dto.IpAddress;

            if (string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = GetClientIp();
            }

            try
            {
                if (!string.IsNullOrEmpty(ipAddress))
                {
                    (latitude, longitude) = await _ipService.GetLocationFromIpAsync(ipAddress);
                }
            }
            catch
            {
                latitude = null;
                longitude = null;
            }

            var complex = new FieldComplex
            {
                OwnerId = dto.OwnerId,
                Name = dto.Name,
                Address = dto.Address,
                Description = dto.Description,
                ImageUrl = imageUrl,
                Status = dto.Status ?? "Active",
                CreatedAt = DateTime.Now,
                Latitude = latitude,
                Longitude = longitude
            };

            var created = await _complexRepository.AddComplexAsync(complex);

            return new FieldComplexResponseDTO
            {
                ComplexId = created.ComplexId,
                OwnerId = created.OwnerId,
                Name = created.Name,
                Address = created.Address,
                Description = created.Description,
                Status = created.Status,
                CreatedAt = created.CreatedAt,
                ImageUrl = created.ImageUrl,
                Latitude = created.Latitude,
                Longitude = created.Longitude
            };
        }

        // =========================
        // ✅ GET ALL
        // =========================
        public async Task<List<FieldComplexResponseDTO>> GetAllComplexesAsync()
        {
            var complexes = await _complexRepository.GetAllComplexesAsync();

            return complexes.Select(c => new FieldComplexResponseDTO
            {
                ComplexId = c.ComplexId,
                OwnerId = c.OwnerId,
                Name = c.Name,
                Address = c.Address,
                Description = c.Description,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                ImageUrl = c.ImageUrl,
                Latitude = c.Latitude,
                Longitude = c.Longitude
            }).ToList();
        }

        // =========================
        // ✅ GET BY ID
        // =========================
        public async Task<FieldComplexResponseDTO?> GetComplexByIdAsync(int complexId)
        {
            var c = await _complexRepository.GetComplexByIdAsync(complexId);
            if (c == null) return null;

            return new FieldComplexResponseDTO
            {
                ComplexId = c.ComplexId,
                OwnerId = c.OwnerId,
                Name = c.Name,
                Address = c.Address,
                Description = c.Description,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                ImageUrl = c.ImageUrl,
                Latitude = c.Latitude,
                Longitude = c.Longitude
            };
        }

        // =========================
        // ✅ UPDATE COMPLEX (CẬP NHẬT LẠI TỌA ĐỘ)
        // =========================
        public async Task<FieldComplexResponseDTO?> UpdateComplexAsync(FieldComplexDTO dto)
        {
            var existing = await _complexRepository.GetComplexByIdAsync(dto.ComplexId);
            if (existing == null) return null;

            existing.Name = dto.Name;
            existing.Address = dto.Address;
            existing.Description = dto.Description;
            existing.OwnerId = dto.OwnerId;
            existing.Status = dto.Status;

            // ✅ Upload ảnh mới nếu có
            if (dto.ImageFile != null)
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(dto.ImageFile.FileName, dto.ImageFile.OpenReadStream()),
                    Folder = "field-complexes"
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                existing.ImageUrl = uploadResult.SecureUrl.AbsoluteUri;
            }

            // ✅ LẤY LẠI IP + TỌA ĐỘ MỚI
            string? ipAddress = dto.IpAddress;

            if (string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = GetClientIp();
            }

            try
            {
                if (!string.IsNullOrEmpty(ipAddress))
                {
                    var (latitude, longitude) = await _ipService.GetLocationFromIpAsync(ipAddress);
                    existing.Latitude = latitude;
                    existing.Longitude = longitude;
                }
            }
            catch
            {
                // Không crash nếu IP API lỗi
            }

            var updated = await _complexRepository.UpdateComplexAsync(existing);

            return new FieldComplexResponseDTO
            {
                ComplexId = updated.ComplexId,
                OwnerId = updated.OwnerId,
                Name = updated.Name,
                Address = updated.Address,
                Description = updated.Description,
                Status = updated.Status,
                CreatedAt = updated.CreatedAt,
                ImageUrl = updated.ImageUrl,
                Latitude = updated.Latitude,
                Longitude = updated.Longitude
            };
        }

        // =========================
        // ✅ DELETE
        // =========================
        public async Task<bool> DeleteComplexAsync(int complexId)
        {
            return await _complexRepository.DeleteComplexAsync(complexId);
        }
    }
}
