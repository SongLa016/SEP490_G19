// File: BallSport.Application/Services/MatchFinding/IMatchFindingService.cs
using BallSport.Application.DTOs.MatchFinding;
using BallSport.Infrastructure.Models;

namespace BallSport.Application.Services.MatchFinding
{
    public interface IMatchFindingService
    {
        /// <summary>
        /// Lấy danh sách kèo đang mở (phân trang, mặc định loại bỏ kèo của chính mình)
        /// </summary>
        Task<PagedResponse<MatchRequestListItemDto>> GetActiveRequestsAsync(int page = 1, int size = 10, int? currentUserId = null);

        /// <summary>
        /// Lấy chi tiết 1 kèo tìm đối thủ (bao gồm danh sách người tham gia + trạng thái của mình)
        /// </summary>
        Task<MatchRequestDetailDto?> GetRequestDetailAsync(int requestId, int currentUserId);

        /// <summary>
        /// Tạo kèo tìm đối thủ (Player A - chủ sân)
        /// </summary>
        Task<int> CreateRequestAsync(CreateMatchRequestDto dto, int userId);

        /// <summary>
        /// Tham gia kèo (Player B)
        /// </summary>
        Task JoinRequestAsync(int requestId, JoinMatchRequestDto dto, int userId);

        /// <summary>
        /// Chủ sân chấp nhận 1 đội → GHÉP ĐỘI THÀNH CÔNG + tự động reject các đội khác
        /// </summary>
        Task<MatchSuccessResponseDto> AcceptParticipantAsync(int requestId, int participantId, int ownerUserId);

        /// <summary>
        /// Chủ sân từ chối hoặc người chơi rút lui
        /// </summary>
        Task RejectOrWithdrawAsync(int requestId, int participantId, int currentUserId);

        /// <summary>
        /// Chủ sân hủy kèo (chỉ trước khi ghép đội thành công)
        /// </summary>
        Task CancelRequestAsync(int requestId, int ownerUserId);

        /// <summary>
        /// Lấy lịch sử ghép đội của người dùng (cả làm chủ lẫn làm khách)
        /// </summary>
        Task<PagedResponse<MatchHistoryDto>> GetMyHistoryAsync(int userId, int page = 1, int size = 10);

        /// <summary>
        /// Kiểm tra booking đã có kèo đang mở chưa (dùng để chặn tạo trùng)
        /// </summary>
        Task<bool> IsBookingAlreadyHasRequestAsync(int bookingId);

        /// <summary>
        /// Lấy MatchRequest theo BookingId (dùng trong CreateRequest để validate)
        /// </summary>
        Task<MatchRequest?> GetRequestByBookingIdAsync(int bookingId);

        /// <summary>
        /// Dọn dẹp kèo quá hạn (có thể chạy bằng Hangfire/BackgroundService)
        /// </summary>
        Task<int> ExpireOldRequestsAsync();
    }
}