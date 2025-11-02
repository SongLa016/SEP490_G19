using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class CreateCommentDTO
    {
        [Required(ErrorMessage = "PostId là bắt buộc")]
        public int PostId { get; set; }

        public int? ParentCommentId { get; set; }  // Null nếu là comment gốc, có giá trị nếu là reply

        [Required(ErrorMessage = "Nội dung bình luận là bắt buộc")]
        [MinLength(1, ErrorMessage = "Nội dung phải có ít nhất 1 ký tự")]
        [MaxLength(1000, ErrorMessage = "Nội dung không được vượt quá 1000 ký tự")]
        public string Content { get; set; } = string.Empty;
    }
}