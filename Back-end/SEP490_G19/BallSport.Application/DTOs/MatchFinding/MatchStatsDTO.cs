namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchStatsDTO
    {
        public int TotalRequests { get; set; }
        public int OpenRequests { get; set; }
        public int PendingRequests { get; set; }
        public int MatchedRequests { get; set; }
        public int CancelledRequests { get; set; }
        public int ExpiredRequests { get; set; }
        public int MyMatches { get; set; }
    }
}