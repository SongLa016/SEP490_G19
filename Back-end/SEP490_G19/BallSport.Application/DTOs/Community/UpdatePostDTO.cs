using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class UpdatePostDTO
    {
        [MaxLength(255)]
        public string? Title { get; set; }

        [MinLength(10, ErrorMessage = "Nội dung phải có ít nhất 10 ký tự")]
        public string? Content { get; set; }

        [MaxLength(500)]
        [Url(ErrorMessage = "URL không hợp lệ")]
        public string? MediaUrl { get; set; }

        public int? FieldId { get; set; }
    }
}