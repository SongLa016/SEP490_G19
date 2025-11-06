namespace BallSport.Application.DTOs.Community
{
    public class ReportStatsDTO
    {
        public int TotalReports { get; set; }
        public int PendingReports { get; set; }
        public int ReviewedReports { get; set; }
        public int ResolvedReports { get; set; }
        public int PostReports { get; set; }
        public int CommentReports { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}