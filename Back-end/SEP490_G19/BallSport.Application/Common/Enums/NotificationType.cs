namespace BallSport.Application.Common.Enums
{
    public enum NotificationType
    {
        NewComment,
        Reply,
        Mention,
        Like,
        ReportResult,
        System,
        MatchRequest,      // Có người gửi yêu cầu ghép kèo
        MatchAccepted,     // Được chấp nhận kèo
        MatchRejected,     // Bị từ chối
        MatchCancelled     // Kèo bị hủy
    }
}