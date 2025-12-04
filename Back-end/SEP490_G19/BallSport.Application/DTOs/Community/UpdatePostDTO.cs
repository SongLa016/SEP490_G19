// File: BallSport.Application.DTOs/Community/UpdatePostDTO.cs
using Microsoft.AspNetCore.Http;

namespace BallSport.Application.DTOs.Community
{
    public class UpdatePostDTO
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public List<IFormFile>? ImageFiles { get; set; }

        public int? FieldId { get; set; }
    }
}