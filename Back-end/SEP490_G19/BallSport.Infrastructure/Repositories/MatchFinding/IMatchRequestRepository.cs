

using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.MatchFinding
{
    public interface IMatchRequestRepository
    {
        // Lấy danh sách yêu cầu tìm đối thủ (có phân trang, filter)
        Task<(IEnumerable<MatchRequest> Requests, int TotalCount)> GetAllMatchRequestsAsync(
            int pageNumber,
            int pageSize,
            string? status = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int? fieldId = null);

        // Lấy chi tiết yêu cầu
        Task<MatchRequest?> GetMatchRequestByIdAsync(int matchRequestId);

        // Lấy yêu cầu theo BookingID
        Task<MatchRequest?> GetMatchRequestByBookingIdAsync(int bookingId);

        // Tạo yêu cầu tìm đối thủ
        Task<MatchRequest> CreateMatchRequestAsync(MatchRequest matchRequest);

        // Cập nhật trạng thái
        Task<MatchRequest?> UpdateMatchRequestStatusAsync(int matchRequestId, string status);

        // Xóa yêu cầu
        Task<bool> DeleteMatchRequestAsync(int matchRequestId);

        // Lấy yêu cầu của user (lịch sử)
        Task<IEnumerable<MatchRequest>> GetMatchRequestsByUserIdAsync(int userId);

        // Kiểm tra booking đã có yêu cầu chưa
        Task<bool> BookingHasMatchRequestAsync(int bookingId);

        // Lấy yêu cầu hết hạn (để auto expire)
        Task<IEnumerable<MatchRequest>> GetExpiredMatchRequestsAsync(int hoursToExpire = 1);

        // Đếm số yêu cầu theo trạng thái
        Task<Dictionary<string, int>> GetMatchRequestStatisticsAsync(int? userId = null);
    }
}