namespace BallSport.Application.DTOs.Community
{
    public class NotificationDTO
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty; // Tên người nhận

        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? TargetId { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }

        // LINK TỰ ĐỘNG – KHÔNG CẦN CỘT TRONG DB
        public string? Link => GenerateDeepLink();

        private string? GenerateDeepLink()
        {
            if (!TargetId.HasValue) return null;

            return Type switch
            {
                "NewComment" or "Reply" or "Mention" or "Like" => $"/posts/{TargetId}",
                "MatchRequest" or "MatchAccepted" or "MatchRejected" or "MatchCancelled" => $"/match-requests/{TargetId}",
                "ReportResult" => $"/reports/{TargetId}",
                "System" => null,
                _ => null
            };
        }
    }
}