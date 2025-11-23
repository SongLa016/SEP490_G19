// File: BallSport.Application.DTOs/Community/UpdatePostDTO.cs
using Microsoft.AspNetCore.Http;

namespace BallSport.Application.DTOs.Community
{
    public class UpdatePostDTO
    {
        public string? Title { get; set; }
        public string? Content { get; set; }

        // XÓA DÒNG NÀY (không ai dùng link cả!)
        // public string? MediaUrl { get; set; }

        // THAY BẰNG: CHO PHÉP UP ẢNH MỚI
        public List<IFormFile>? ImageFiles { get; set; }

        public int? FieldId { get; set; }
    }
}