// ==========================================
// FILE: BallSport.Infrastructure/Repositories/MatchFinding/IMatchParticipantRepository.cs
// ==========================================

using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.MatchFinding
{
    public interface IMatchParticipantRepository
    {
        // Lấy danh sách người tham gia của một trận
        Task<IEnumerable<MatchParticipant>> GetParticipantsByMatchRequestIdAsync(int matchRequestId);

        // Lấy thông tin participant
        Task<MatchParticipant?> GetParticipantByIdAsync(int participantId);

        // Thêm người tham gia (join match)
        Task<MatchParticipant> AddParticipantAsync(MatchParticipant participant);

        // Xóa người tham gia
        Task<bool> RemoveParticipantAsync(int participantId);

        // Kiểm tra user đã join chưa
        Task<bool> HasUserJoinedAsync(int matchRequestId, int userId);

        // Kiểm tra user có xung đột thời gian không
        Task<bool> HasTimeConflictAsync(int userId, DateTime matchDate, int timeSlotId);

        // Lấy tất cả trận user đã join (bao gồm pending và matched)
        Task<IEnumerable<MatchParticipant>> GetUserParticipationsAsync(int userId);

        // Đếm số người tham gia
        Task<int> CountParticipantsByMatchRequestIdAsync(int matchRequestId);
    }
}