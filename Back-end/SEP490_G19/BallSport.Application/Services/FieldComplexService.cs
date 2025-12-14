using BallSport.API.Controllers.DistanceCalculator;
using BallSport.Application.DTOs;
using BallSport.Application.Services.GoongMap;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

public class FieldComplexService
{
  
    private readonly FieldComplexRepository _complexRepository;
    private readonly Cloudinary _cloudinary;
    private readonly GoongMapService _goongMapService;
    private readonly ILocationCacheService _cacheService;
    public FieldComplexService(
        FieldComplexRepository complexRepository,
        Cloudinary cloudinary,
        GoongMapService goongMapService, ILocationCacheService cacheService)
    {
        _complexRepository = complexRepository;
        _cloudinary = cloudinary;
        _goongMapService = goongMapService;
        _cacheService = cacheService;
    }

    //  thêm khu sân
    public async Task<FieldComplexResponseDTO> AddComplexAsync(
    FieldComplexDTO dto,
    int userId,
    string role)
    {
        //  AUTHORIZATION
        if (role != "Owner")
            throw new UnauthorizedAccessException("Chỉ Owner mới được thêm khu sân.");

        string? imageUrl = null;

        //  UPLOAD IMAGE
        if (dto.ImageFile != null)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(
                    dto.ImageFile.FileName,
                    dto.ImageFile.OpenReadStream()),
                Folder = "field-complexes"
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            imageUrl = uploadResult.SecureUrl.AbsoluteUri;
        }

        // GEOCODING
        var location = await _goongMapService.GetLocationDetailAsync(dto.Address);
        if (location == null)
            throw new Exception("Không lấy được tọa độ từ địa chỉ.");

        var (ward, district, province) =
            ExtractAdministrativeUnits(location.Value.formattedAddress);

        //  CREATE ENTITY 
        var complex = new FieldComplex
        {
            OwnerId = userId,
            Name = dto.Name,
            Address = location.Value.formattedAddress,
            Description = dto.Description,
            ImageUrl = imageUrl,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
            CreatedAt = DateTime.UtcNow,
            Latitude = location.Value.lat,
            Longitude = location.Value.lng,
            Ward = ward,
            District = district,
            Province = province
        };

        var created = await _complexRepository.AddComplexAsync(complex);

        // ♻ CACHE INVALIDATE
        _cacheService.ClearNearbyCache();

        return MapToResponseDTO(created);
    }


    //  Lấy tất cả
    public async Task<List<FieldComplexResponseDTO>> GetAllComplexesAsync()
    {
        var complexes = await _complexRepository.GetAllComplexesAsync();

        return complexes.Select(MapToResponseDTO).ToList();
    }

    //  Lấy chi tiết
    public async Task<FieldComplexResponseDTO?> GetComplexByIdAsync(int complexId)
    {
        var c = await _complexRepository.GetComplexByIdAsync(complexId);
        return c == null ? null : MapToResponseDTO(c);
    }


    //  CẬP NHẬT
    public async Task<FieldComplexResponseDTO?> UpdateComplexAsync(
    FieldComplexDTO dto,
    int userId,
    string role)
    {
        var existing = await _complexRepository.GetComplexByIdAsync(dto.ComplexId);
        if (existing == null)
            return null;

        //  AUTHORIZATION
        if (role == "Owner")
        {
            if (existing.OwnerId != userId)
                throw new UnauthorizedAccessException(
                    "Owner không được sửa khu sân của người khác.");
        }
        else if (role != "Admin")
        {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật khu sân.");
        }

        // ❗ KHÔNG BAO GIỜ ĐỔI OWNER ID
        existing.Name = dto.Name;
        existing.Description = dto.Description;
        existing.Status = dto.Status;

        //  ĐỔI ĐỊA CHỈ → CẬP NHẬT TỌA ĐỘ
        if (!string.IsNullOrWhiteSpace(dto.Address)
            && dto.Address != existing.Address)
        {
            var location = await _goongMapService.GetLocationDetailAsync(dto.Address);
            if (location == null)
                throw new Exception("Không tìm được địa chỉ hợp lệ.");

            var (ward, district, province) =
                ExtractAdministrativeUnits(location.Value.formattedAddress);

            existing.Address = location.Value.formattedAddress;
            existing.Latitude = location.Value.lat;
            existing.Longitude = location.Value.lng;
            existing.Ward = ward;
            existing.District = district;
            existing.Province = province;
        }

        //  UPDATE ẢNH
        if (dto.ImageFile != null)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(
                    dto.ImageFile.FileName,
                    dto.ImageFile.OpenReadStream()),
                Folder = "field-complexes"
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            existing.ImageUrl = uploadResult.SecureUrl.AbsoluteUri;
        }

        var updated = await _complexRepository.UpdateComplexAsync(existing);

        //  CLEAR CACHE
        _cacheService.ClearNearbyCache();

        return MapToResponseDTO(updated);
    }

    //  XÓA
    public async Task<bool> DeleteComplexAsync(
    int complexId,
    int userId,
    string role)
    {
        if (role != "Owner")
            throw new UnauthorizedAccessException("Chỉ Owner mới được xóa khu sân.");

        var existing = await _complexRepository.GetComplexByIdAsync(complexId);
        if (existing == null)
            return false;

        if (existing.OwnerId != userId)
            throw new UnauthorizedAccessException(
                "Bạn không có quyền xóa khu sân này."
            );

        var result = await _complexRepository.DeleteComplexAsync(complexId);

        if (result)
            _cacheService.ClearNearbyCache();

        return result;
    }



    // HÀM MAP CHUNG
    private static (string? ward, string? district, string? province)
    ExtractAdministrativeUnits(string formattedAddress)
{
    if (string.IsNullOrWhiteSpace(formattedAddress))
        return (null, null, null);

    var parts = formattedAddress
        .Split(',')
        .Select(p => p.Trim())
        .ToList();

    string? ward = null;
    string? district = null;
    string? province = null;

    foreach (var part in parts)
    {
        var lower = part.ToLower();

        if (lower.Contains("phường") || lower.Contains("xã") || lower.Contains("thị trấn"))
        {
            ward = part;
        }
        else if (lower.Contains("quận") || lower.Contains("huyện") || lower.Contains("thị xã"))
        {
            district = part;
        }
        else if (lower.Contains("tỉnh") || lower.Contains("thành phố") || lower.StartsWith("tp"))
        {
            province = part;
        }
    }

    // fall back khi không trả được phường quận

    // Hà Nội, TP.HCM, Đà Nẵng,...
    if (province == null && parts.Count >= 1)
        province = parts.Last();

    // Nam Từ Liêm, Quận 9, Cầu Giấy,...
    if (district == null && parts.Count >= 2)
        district = parts[^2];

    // Mỹ Đình, Hiệp Phú,...
    if (ward == null && parts.Count >= 3)
        ward = parts[^3];

    return (ward, district, province);
}


    private static FieldComplexResponseDTO MapToResponseDTO(FieldComplex c)
    {
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
            Longitude = c.Longitude,
            Ward = c.Ward,
            District = c.District,
            Province = c.Province
        };
    }
}
