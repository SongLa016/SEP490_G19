using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class CreatePostDTO
    {
        [MaxLength(255)]
        public string? Title { get; set; }

        [Required(ErrorMessage = "Nội dung bài viết là bắt buộc")]
        [MinLength(10, ErrorMessage = "Nội dung phải có ít nhất 10 ký tự")]
        public string Content { get; set; } = string.Empty;

        [MaxLength(500)]
        [Url(ErrorMessage = "URL không hợp lệ")]
        public string? MediaUrl { get; set; }

        public int? FieldId { get; set; } // HOÀN HẢO – CHO PHÉP NULL, KHÔNG CẦN THÊM GÌ NỮA!
    }
}