using System.ComponentModel.DataAnnotations;

namespace BallSport.Application.DTOs.Community
{
    public class CreateNotificationDTO
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
        [StringLength(100, MinimumLength = 5, ErrorMessage = "Tiêu đề phải từ 5 đến 100 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung là bắt buộc")]
        [StringLength(500, ErrorMessage = "Nội dung không được vượt quá 500 ký tự")]
        public string Message { get; set; } = string.Empty;

        [Required(ErrorMessage = "Type là bắt buộc")]
        [RegularExpression(
            "^(NewComment|Reply|Mention|Like|ReportResult|System|MatchRequest|MatchAccepted|MatchRejected|MatchCancelled)$",
            ErrorMessage = "Type không hợp lệ. Chỉ chấp nhận: NewComment, Reply, Mention, Like, ReportResult, System, MatchRequest, MatchAccepted, MatchRejected, MatchCancelled")]
        public string Type { get; set; } = string.Empty;

        public int? TargetId { get; set; } // PostId, CommentId, MatchRequestId, BookingId...

        // Không cần Link ở đây → sẽ tự động sinh ở DTO trả về
    }
}