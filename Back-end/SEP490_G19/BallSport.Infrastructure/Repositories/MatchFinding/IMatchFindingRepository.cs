// File: BallSport.Infrastructure.Repositories/MatchFinding/IMatchFindingRepository.cs
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.MatchFinding
{
    public interface IMatchFindingRepository
    {
        /// <summary>
        /// Lấy chi tiết 1 kèo tìm đối thủ + Include đầy đủ navigation (Booking → Schedule → Slot → Field → Complex, Participants → User)
        /// </summary>
        Task<MatchRequest?> GetDetailAsync(int matchRequestId);

        /// <summary>
        /// Lấy tất cả kèo đang mở (Status = "Open") + Include đầy đủ để hiển thị danh sách
        /// </summary>
        Task<List<MatchRequest>> GetActiveRequestsAsync();

        /// <summary>
        /// Lấy lịch sử ghép đội của 1 user (cả chủ sân và đội được ghép)
        /// </summary>
        Task<List<PlayerMatchHistory>> GetHistoryByUserAsync(int userId);

        /// <summary>
        /// Lấy 1 participant cụ thể theo requestId + userId (dùng để kiểm tra đã join chưa)
        /// </summary>
        Task<MatchParticipant?> GetParticipantAsync(int requestId, int userId);

        /// <summary>
        /// Thêm mới 1 MatchRequest
        /// </summary>
        Task AddMatchRequestAsync(MatchRequest request);

        /// <summary>
        /// Thêm 1 đội tham gia kèo
        /// </summary>
        Task AddParticipantAsync(MatchParticipant participant);

        /// <summary>
        /// Cập nhật MatchRequest (Status, OpponentUserId, MatchedAt, v.v.)
        /// </summary>
        Task UpdateMatchRequestAsync(MatchRequest request);

        /// <summary>
        /// Cập nhật trạng thái participant (Accepted/Rejected/Withdrawn)
        /// </summary>
        Task UpdateParticipantAsync(MatchParticipant participant);

        /// <summary>
        /// Hủy kèo (Status = Cancelled) – giữ lại để tương thích nếu cần riêng
        /// </summary>
        Task CancelMatchRequestAsync(int requestId);

        /// <summary>
        /// Lấy MatchRequest theo BookingId (dùng để chặn tạo trùng)
        /// </summary>
        Task<MatchRequest?> GetRequestByBookingIdAsync(int bookingId);

        /// <summary>
        /// Kiểm tra booking đã có kèo đang mở chưa (Status = "Open")
        /// </summary>
        Task<bool> HasActiveRequestForBookingAsync(int bookingId);

        // THÊM 2 METHOD SIÊU QUAN TRỌNG ĐỂ TỐI ƯU + TRÁNH N+1 QUERY
        /// <summary>
        /// Lấy chi tiết kèo + tự động xác định IsOwner, HasJoined, MyStatus cho user hiện tại
        /// (Dùng trong GetRequestDetailAsync để tránh query thừa)
        /// </summary>
        Task<MatchRequest?> GetFullDetailAsync(int matchRequestId, int currentUserId);

        /// <summary>
        /// Lấy danh sách kèo đang mở + lọc bỏ kèo của chính mình (nếu cần)
        /// </summary>
        Task<List<MatchRequest>> GetActiveRequestsExcludeMineAsync(int currentUserId);
    }
}