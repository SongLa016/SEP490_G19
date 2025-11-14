namespace BallSport.Application.DTOs.Community
{
    public class ReportDTO
    {
        public int ReportId { get; set; }
        public int ReporterId { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;  // Post hoặc Comment
        public int TargetId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Status { get; set; }  // Pending, Reviewed, Resolved
        public int? HandledBy { get; set; }  // Admin ID đã xử lý
        public string? HandledByName { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}