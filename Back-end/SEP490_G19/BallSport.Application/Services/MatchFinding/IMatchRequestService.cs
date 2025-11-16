// ==========================================
// FILE: BallSport.Application/Services/MatchFinding/IMatchRequestService.cs
// ==========================================

using BallSport.Application.DTOs.MatchFinding;

namespace BallSport.Application.Services.MatchFinding
{
    public interface IMatchRequestService
    {
        // Lấy danh sách yêu cầu tìm đối thủ (có phân trang)
        Task<(IEnumerable<MatchRequestDTO> Requests, int TotalCount)> GetAllMatchRequestsAsync(
            int pageNumber,
            int pageSize,
            MatchFilterDTO? filter = null);

        // Lấy chi tiết yêu cầu
        Task<MatchRequestDetailDTO?> GetMatchRequestDetailAsync(int matchRequestId);

        // Tạo yêu cầu tìm đối thủ (Player A)
        Task<MatchRequestDTO> CreateMatchRequestAsync(CreateMatchRequestDTO createDto, int userId);

        // Hủy yêu cầu tìm đối thủ (Player A)
        Task<bool> CancelMatchRequestAsync(int matchRequestId, int userId);

        // Join trận (Player B)
        Task<ParticipantDTO> JoinMatchAsync(JoinMatchRequestDTO joinDto, int userId);

        // Chấp nhận/Từ chối người tham gia (Player A)
        Task<MatchRequestDTO?> RespondToJoinRequestAsync(
            int matchRequestId,
            RespondMatchRequestDTO respondDto,
            int userId);

        // Lấy các trận của tôi (My Matches)
        Task<IEnumerable<MyMatchDTO>> GetMyMatchesAsync(int userId);

        // Lấy lịch sử tìm đối của tôi
        Task<IEnumerable<MatchRequestDTO>> GetMyMatchRequestsAsync(int userId);

        // Thống kê
        Task<MatchStatsDTO> GetMatchStatisticsAsync(int? userId = null);

        // Auto expire các yêu cầu quá hạn
        Task<int> AutoExpireMatchRequestsAsync(int hoursToExpire = 1);

        // Kiểm tra booking đã có yêu cầu chưa
        Task<bool> BookingHasMatchRequestAsync(int bookingId);
    }
}