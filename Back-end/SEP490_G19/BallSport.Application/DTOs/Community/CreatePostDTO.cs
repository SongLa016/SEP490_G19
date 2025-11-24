using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class CreatePostDTO
    {
        [MaxLength(255)]
        public string? Title { get; set; }

        [Required(ErrorMessage = "Nội dung bài viết là bắt buộc")]
       
        public string Content { get; set; } = string.Empty;

        // UPLOAD NHIỀU ẢNH TỪ MÁY
        [Display(Name = "Hình ảnh")]
        public List<IFormFile>? ImageFiles { get; set; }

        public int? FieldId { get; set; }
    }
}