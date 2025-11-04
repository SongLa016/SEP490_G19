using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class CreateReportDTO
    {
        [Required(ErrorMessage = "TargetType là bắt buộc")]
        [RegularExpression("^(Post|Comment)$", ErrorMessage = "TargetType phải là Post hoặc Comment")]
        public string TargetType { get; set; } = string.Empty;

        [Required(ErrorMessage = "TargetId là bắt buộc")]
        public int TargetId { get; set; }

        [Required(ErrorMessage = "Lý do báo cáo là bắt buộc")]
        [MinLength(10, ErrorMessage = "Lý do phải có ít nhất 10 ký tự")]
        [MaxLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự")]
        public string Reason { get; set; } = string.Empty;
    }
}