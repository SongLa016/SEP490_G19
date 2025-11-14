using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class CreateNotificationDTO
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Type là bắt buộc")]
        [RegularExpression("^(NewComment|Reply|Mention|Like|ReportResult|System)$",
            ErrorMessage = "Type phải là: NewComment, Reply, Mention, Like, ReportResult, hoặc System")]
        public string Type { get; set; } = string.Empty;

        public int? TargetId { get; set; }  // ID của Post/Comment liên quan

        [Required(ErrorMessage = "Message là bắt buộc")]
        [MaxLength(500, ErrorMessage = "Message không được vượt quá 500 ký tự")]
        public string Message { get; set; } = string.Empty;
    }
}