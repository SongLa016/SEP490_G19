// File: BallSport.Application/DTOs/Community/CreateNotificationDTO.cs
using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class CreateNotificationDTO
    {
        // CHO PHÉP NULL KHI GỬI TOÀN HỆ THỐNG
        public int? UserId { get; set; }

        [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
        [StringLength(100, MinimumLength = 5, ErrorMessage = "Tiêu đề phải từ 5 đến 100 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung là bắt buộc")]
        [StringLength(500, ErrorMessage = "Nội dung không được vượt quá 500 ký tự")]
        public string Message { get; set; } = string.Empty;

        [Required(ErrorMessage = "Type là bắt buộc")]
        [RegularExpression(
            "^(NewComment|Reply|Mention|Like|ReportResult|System|MatchJoinRequest|MatchAccepted|Rejected|Cancelled)$",
            ErrorMessage = "Type không hợp lệ")]
        public string Type { get; set; } = string.Empty;

        public int? TargetId { get; set; } = 0;
    }
}