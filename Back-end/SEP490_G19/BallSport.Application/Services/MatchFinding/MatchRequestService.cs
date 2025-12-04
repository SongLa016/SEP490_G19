// File: BallSport.Application/Services/MatchFinding/MatchFindingService.cs
using BallSport.Application.Common.Extensions;
using BallSport.Application.DTOs.Community;
using BallSport.Application.DTOs.MatchFinding;
using BallSport.Application.Services.Community;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.MatchFinding;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Application.Services.MatchFinding
{
    public class MatchFindingService : IMatchFindingService
    {
        private readonly IMatchFindingRepository _repo;
        private readonly Sep490G19v1Context _context;
        private readonly INotificationService _notificationService;

        public MatchFindingService(
            IMatchFindingRepository repo,
            Sep490G19v1Context context,
            INotificationService notificationService)
        {
            _repo = repo ?? throw new ArgumentNullException(nameof(repo));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
        }

        // 1. LẤY DANH SÁCH KÈO ĐANG MỞ
        public async Task<PagedResponse<MatchRequestListItemDto>> GetActiveRequestsAsync(int page = 1, int size = 10, int? currentUserId = null)
        {
            var requests = await _repo.GetActiveRequestsAsync();

            if (currentUserId.HasValue)
            {
                requests = requests.Where(r => r.CreatedBy != currentUserId.Value).ToList();
            }

            var dtos = requests.Select(r =>
            {
                var matchDateTime = r.Booking!.Schedule!.Date.ToDateTime(r.Booking.Schedule.Slot!.StartTime);
                return new MatchRequestListItemDto
                {
                    MatchRequestId = r.MatchRequestId,
                    FieldName = r.Booking.Schedule.Field?.Name ?? "Sân bóng",
                    ComplexName = r.Booking.Schedule.Field?.Complex?.Name ?? "Sân bóng",
                    MatchDate = matchDateTime,
                    StartTime = r.Booking.Schedule.Slot.StartTime.ToString(@"HH\:mm"),
                    EndTime = r.Booking.Schedule.Slot.EndTime.ToString(@"HH\:mm"),
                    PlayerCount = (PlayerCountOption)(r.PlayerCount ?? 7),
                    CreatorTeamName = r.MatchParticipants?
                        .FirstOrDefault(p => p.UserId == r.CreatedBy)?.TeamName ?? "Đội chủ sân",
                    JoinedCount = r.MatchParticipants?.Count(p => p.StatusFromB == "Pending") ?? 0,
                    ExpiresAt = r.ExpiresAt ?? DateTime.UtcNow.AddHours(48),
                    IsMyRequest = false
                };
            })
            .OrderByDescending(x => x.ExpiresAt)
            .ToList();

            var total = dtos.Count;
            var items = dtos.Skip((page - 1) * size).Take(size).ToList();

            return new PagedResponse<MatchRequestListItemDto>
            {
                Content = items,
                PageNumber = page,
                PageSize = size,
                TotalElements = total,
                TotalPages = (int)Math.Ceiling(total / (double)size)
                // HasNext & HasPrevious là read-only → tự động tính trong class PagedResponse
            };
        }

        // 2. CHI TIẾT KÈO
        public async Task<MatchRequestDetailDto?> GetRequestDetailAsync(int requestId, int currentUserId)
        {
            var request = await _repo.GetDetailAsync(requestId);
            if (request == null) return null;

            var matchDateTime = request.Booking!.Schedule!.Date.ToDateTime(request.Booking.Schedule.Slot!.StartTime);
            var me = request.MatchParticipants?.FirstOrDefault(p => p.UserId == currentUserId);

            return new MatchRequestDetailDto
            {
                MatchRequestId = request.MatchRequestId,
                BookingId = request.BookingId ?? 0,
                FieldName = request.Booking.Schedule.Field?.Name ?? "Sân bóng",
                ComplexName = request.Booking.Schedule.Field?.Complex?.Name ?? "Sân bóng",
                MatchDate = matchDateTime,
                StartTime = request.Booking.Schedule.Slot.StartTime.ToString(@"HH\:mm"),
                EndTime = request.Booking.Schedule.Slot.EndTime.ToString(@"HH\:mm"),
                Status = request.Status ?? "Open",
                CreatorUserId = request.CreatedBy,
                CreatorFullName = request.CreatedByNavigation?.FullName ?? "Ẩn danh",
                CreatorTeamName = request.MatchParticipants?
                    .FirstOrDefault(p => p.UserId == request.CreatedBy)?.TeamName ?? "Đội chủ sân",
                PlayerCount = (PlayerCountOption)(request.PlayerCount ?? 7),
                Description = request.Description,
                CreatedAt = request.CreatedAt ?? DateTime.UtcNow,
                ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddHours(48),
                IsOwner = request.CreatedBy == currentUserId,
                HasJoined = me != null,
                MyStatus = me?.StatusFromB ?? "None",
                Participants = request.MatchParticipants?.Select(p => new MatchParticipantDto
                {
                    ParticipantId = p.ParticipantId,
                    UserId = p.UserId,
                    FullName = p.User?.FullName ?? "Ẩn danh",
                    TeamName = p.TeamName ?? "Đội bóng",
                    PlayerCount = (PlayerCountOption)(p.PlayerCount ?? 7),
                    ContactPhone = p.ContactPhone,
                    Note = p.Note,
                    StatusFromB = p.StatusFromB ?? "Pending",
                    StatusFromA = p.StatusFromA ?? "Cancelled",
                    JoinedAt = p.JoinedAt ?? DateTime.UtcNow,
                    IsMe = p.UserId == currentUserId
                }).ToList() ?? new()
            };
        }

        // 3. TẠO KÈO
        public async Task<int> CreateRequestAsync(CreateMatchRequestDto dto, int userId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Schedule!).ThenInclude(s => s.Slot!)
                .Include(b => b.Schedule!).ThenInclude(s => s.Field)
                .FirstOrDefaultAsync(b => b.BookingId == dto.BookingId && b.UserId == userId)
                ?? throw new UnauthorizedAccessException("Không tìm thấy booking hoặc không phải của bạn!");

            if (booking.BookingStatus is "Cancelled" or "Completed")
                throw new InvalidOperationException("Không thể tạo kèo cho booking đã hủy hoặc đã đá xong!");

            if (booking.HasOpponent == true)
                throw new InvalidOperationException("Booking này đã có đối thủ rồi!");

            var matchDateTime = booking.Schedule.Date.ToDateTime(booking.Schedule.Slot!.StartTime);
            if (matchDateTime <= DateTime.Now)
                throw new InvalidOperationException("Không thể tạo kèo cho trận đã qua giờ đá!");

            if (await _repo.HasActiveRequestForBookingAsync(dto.BookingId))
                throw new InvalidOperationException("Booking này đã có kèo tìm đối thủ rồi!");

            var request = new MatchRequest
            {
                BookingId = dto.BookingId,
                CreatedBy = userId,
                PlayerCount = (int)dto.PlayerCount,
                Description = dto.Description,
                Status = "Open",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(dto.ExpiresInHours ?? 48)
            };

            await _repo.AddMatchRequestAsync(request);

            var creator = new MatchParticipant
            {
                MatchRequestId = request.MatchRequestId,
                UserId = userId,
                TeamName = "Đội chủ sân",
                PlayerCount = (int)dto.PlayerCount,
                StatusFromB = "Accepted",
                StatusFromA = "Accepted",
                JoinedAt = DateTime.UtcNow
            };

            await _repo.AddParticipantAsync(creator);

            return request.MatchRequestId;
        }

        // 4. THAM GIA KÈO + GỬI THÔNG BÁO CHO CHỦ SÂN
        public async Task JoinRequestAsync(int requestId, JoinMatchRequestDto dto, int userId)
        {
            var request = await _repo.GetDetailAsync(requestId)
                ?? throw new KeyNotFoundException("Không tìm thấy kèo");

            if (request.Status != "Open")
                throw new InvalidOperationException("Kèo đã đóng!");

            if (request.CreatedBy == userId)
                throw new InvalidOperationException("Không thể tham gia kèo của chính mình!");

            if (request.MatchParticipants?.Any(p => p.UserId == userId) == true)
                throw new InvalidOperationException("Bạn đã tham gia kèo này rồi!");

            var participant = new MatchParticipant
            {
                MatchRequestId = requestId,
                UserId = userId,
                TeamName = dto.TeamName,
                PlayerCount = (int)dto.PlayerCount,
                ContactPhone = dto.ContactPhone,
                Note = dto.Note,
                StatusFromB = "Pending",
                StatusFromA = "Accepted",
                JoinedAt = DateTime.UtcNow
            };

            await _repo.AddParticipantAsync(participant);

            var joinNoti = new CreateNotificationDTO
            {
                UserId = request.CreatedBy,
                Type = "MatchJoinRequest",
                TargetId = requestId,
                Message = $"Đội \"{dto.TeamName}\" ({dto.PlayerCount} người) vừa gửi yêu cầu tham gia kèo của bạn!"
            };

            await _notificationService.CreateNotificationAsync(joinNoti);
        }

        // 5. CHẤP NHẬN ĐỘI → GHÉP THÀNH CÔNG + GỬI THÔNG BÁO
        public async Task<MatchSuccessResponseDto> AcceptParticipantAsync(int requestId, int participantId, int ownerUserId)
        {
            var request = await _repo.GetDetailAsync(requestId)
                ?? throw new KeyNotFoundException("Không tìm thấy kèo");

            if (request.CreatedBy != ownerUserId)
                throw new UnauthorizedAccessException("Chỉ chủ sân mới được chấp nhận!");

            var participant = request.MatchParticipants?.FirstOrDefault(p => p.ParticipantId == participantId)
                ?? throw new KeyNotFoundException("Không tìm thấy đội tham gia!");

            if (participant.StatusFromB != "Pending")
                throw new InvalidOperationException("Đội này không ở trạng thái chờ duyệt!");

            var matchDateTime = request.Booking!.Schedule!.Date.ToDateTime(request.Booking.Schedule.Slot!.StartTime);

            request.Status = "Matched";
            request.OpponentUserId = participant.UserId;
            request.MatchedAt = DateTime.UtcNow;
            participant.StatusFromB = "Accepted";
            participant.StatusFromA = "Accepted";

            var notifications = new List<CreateNotificationDTO>();

            // Từ chối các đội còn lại
            foreach (var p in request.MatchParticipants!.Where(p => p.ParticipantId != participantId && p.StatusFromB == "Pending"))
            {
                p.StatusFromB = "Rejected";
                p.StatusFromA = "Rejected";
                await _repo.UpdateParticipantAsync(p);

                notifications.Add(new CreateNotificationDTO
                {
                    UserId = p.UserId,
                    Type = "MatchRejected",
                    TargetId = requestId,
                    Message = "Rất tiếc! Chủ sân đã chọn đội khác. Chúc bạn sớm tìm được kèo mới!"
                });
            }

            await _repo.UpdateMatchRequestAsync(request);
            await _repo.UpdateParticipantAsync(participant);

            // Gửi thông báo thành công cho cả 2 bên
            notifications.Add(new CreateNotificationDTO
            {
                UserId = ownerUserId,
                Type = "MatchAccepted",
                TargetId = request.MatchRequestId,
                Message = $"Ghép kèo thành công với đội \"{participant.TeamName}\"! Chúc trận đấu vui vẻ!"
            });

            notifications.Add(new CreateNotificationDTO
            {
                UserId = participant.UserId,
                Type = "MatchAccepted",
                TargetId = request.MatchRequestId,
                Message = $"CHÚC MỪNG! Bạn đã được ghép trận tại {request.Booking.Schedule.Field?.Name} vào {matchDateTime:HH:mm dd/MM/yyyy}!"
            });

            if (notifications.Any())
                await _notificationService.CreateBulkNotificationsAsync(notifications);

            return new MatchSuccessResponseDto
            {
                Success = true,
                Message = "GHÉP ĐỘI THÀNH CÔNG! CHÚC HAI ĐỘI ĐÁ VUI VẺ!",
                Data = new MatchSuccessData
                {
                    MatchRequestId = request.MatchRequestId,
                    BookingId = request.BookingId ?? 0,
                    FieldName = request.Booking.Schedule.Field?.Name ?? "Sân bóng",
                    ComplexName = request.Booking.Schedule.Field?.Complex?.Name ?? "Sân bóng",
                    MatchDate = matchDateTime,
                    StartTime = request.Booking.Schedule.Slot.StartTime.ToString(@"HH\:mm"),
                    EndTime = request.Booking.Schedule.Slot.EndTime.ToString(@"HH\:mm"),
                    Opponent = new UserInfoDto
                    {
                        UserId = participant.UserId,
                        FullName = participant.User?.FullName ?? "Ẩn danh",
                        Phone = participant.User?.Phone ?? "Không có"
                    },
                    OpponentTeamName = participant.TeamName ?? "Đội bóng",
                    OpponentPhone = participant.ContactPhone ?? "Không có"
                }
            };
        }

        // 6. HỦY KÈO
        public async Task CancelRequestAsync(int requestId, int ownerUserId)
        {
            var request = await _repo.GetDetailAsync(requestId)
                ?? throw new KeyNotFoundException("Không tìm thấy kèo");

            if (request.CreatedBy != ownerUserId)
                throw new UnauthorizedAccessException("Chỉ chủ sân mới được hủy!");

            if (request.Status == "Matched")
                throw new InvalidOperationException("Không thể hủy kèo đã ghép thành công!");

            request.Status = "Cancelled";
            await _repo.UpdateMatchRequestAsync(request);

            if (request.MatchParticipants?.Any(p => p.UserId != ownerUserId) == true)
            {
                var cancelNotis = request.MatchParticipants!
                    .Where(p => p.UserId != ownerUserId)
                    .Select(p => new CreateNotificationDTO
                    {
                        UserId = p.UserId,
                        Type = "MatchCancelled",
                        TargetId = requestId,
                        Message = "Chủ sân đã hủy kèo tìm đối thủ. Rất tiếc!"
                    });

                await _notificationService.CreateBulkNotificationsAsync(cancelNotis);
            }
        }

        // 7. TỪ CHỐI / RÚT LUI
        public async Task RejectOrWithdrawAsync(int requestId, int participantId, int currentUserId)
        {
            var request = await _repo.GetDetailAsync(requestId)
                ?? throw new KeyNotFoundException("Không tìm thấy kèo");

            var participant = request.MatchParticipants?.FirstOrDefault(p => p.ParticipantId == participantId)
                ?? throw new KeyNotFoundException("Không tìm thấy người chơi!");

            bool isOwner = request.CreatedBy == currentUserId;
            bool isMe = participant.UserId == currentUserId;

            if (!isOwner && !isMe)
                throw new UnauthorizedAccessException("Bạn không có quyền!");

            participant.StatusFromB = isOwner ? "Rejected" : "Withdrawn";
            await _repo.UpdateParticipantAsync(participant);

            if (isOwner)
            {
                var rejectNoti = new CreateNotificationDTO
                {
                    UserId = participant.UserId,
                    Type = "MatchRejected",
                    TargetId = requestId,
                    Message = "Chủ sân đã từ chối yêu cầu tham gia kèo của bạn."
                };
                await _notificationService.CreateNotificationAsync(rejectNoti);
            }

            if (!request.MatchParticipants!.Any(p => p.StatusFromB == "Pending"))
            {
                request.Status = "Open";
                await _repo.UpdateMatchRequestAsync(request);
            }
        }

        // 8. LỊCH SỬ CỦA TÔI
        public async Task<PagedResponse<MatchHistoryDto>> GetMyHistoryAsync(int userId, int page = 1, int size = 10)
        {
            var histories = await _repo.GetHistoryByUserAsync(userId);
            var dtos = histories.Select(h =>
            {
                var matchDateTime = h.MatchRequest?.Booking?.Schedule?.Date
                    .ToDateTime(h.MatchRequest!.Booking!.Schedule!.Slot!.StartTime) ?? DateTime.Now;

                return new MatchHistoryDto
                {
                    HistoryId = h.HistoryId,
                    MatchRequestId = h.MatchRequestId,
                    Role = h.Role ?? "Unknown",
                    FinalStatus = h.FinalStatus ?? "Unknown",
                    MatchDate = matchDateTime,
                    StartTime = h.MatchRequest.Booking.Schedule.Slot.StartTime.ToString(@"HH\:mm"),
                    EndTime = h.MatchRequest.Booking.Schedule.Slot.EndTime.ToString(@"HH\:mm"),
                    FieldName = h.MatchRequest.Booking.Schedule.Field?.Name ?? "Sân bóng",
                    ComplexName = h.MatchRequest.Booking.Schedule.Field?.Complex?.Name ?? "Sân bóng",
                    PlayerCount = (PlayerCountOption)(h.MatchRequest.PlayerCount ?? 7),
                    OpponentUserId = h.OpponentUserId ?? 0,
                    OpponentFullName = h.OpponentUser?.FullName ?? "Ẩn danh",
                    OpponentTeamName = h.MatchRequest.MatchParticipants?
                        .FirstOrDefault(p => p.UserId == h.OpponentUserId)?.TeamName ?? "Đối thủ",
                    OpponentPhone = h.OpponentUser?.Phone,
                    CreatedAt = h.CreatedAt ?? DateTime.UtcNow
                };
            })
            .OrderByDescending(x => x.CreatedAt)
            .ToList();

            var total = dtos.Count;
            var items = dtos.Skip((page - 1) * size).Take(size).ToList();

            return new PagedResponse<MatchHistoryDto>
            {
                Content = items,
                PageNumber = page,
                PageSize = size,
                TotalElements = total,
                TotalPages = (int)Math.Ceiling(total / (double)size)
            };
        }

        // 9. KIỂM TRA BOOKING ĐÃ CÓ KÈO CHƯA
        public async Task<bool> IsBookingAlreadyHasRequestAsync(int bookingId)
            => await _repo.HasActiveRequestForBookingAsync(bookingId);

        // 10. LẤY REQUEST THEO BOOKING ID
        public async Task<MatchRequest?> GetRequestByBookingIdAsync(int bookingId)
            => await _repo.GetRequestByBookingIdAsync(bookingId);

        // 11. THÔNG TIN BOOKING CÓ KÈO HAY KHÔNG
        public async Task<(bool hasRequest, int? matchRequestId)> GetBookingRequestInfoAsync(int bookingId)
        {
            var request = await _repo.GetRequestByBookingIdAsync(bookingId);
            if (request == null) return (false, null);
            bool hasActive = request.Status == "Open" || request.Status == "Matched";
            return (hasActive, hasActive ? request.MatchRequestId : null);
        }

        // 12. DỌN KÈO QUÁ HẠN (ADMIN)
        public async Task<int> ExpireOldRequestsAsync()
        {
            var requests = await _repo.GetActiveRequestsAsync();
            var now = DateTime.UtcNow;
            var expired = requests
                .Where(r => r.ExpiresAt.HasValue && r.ExpiresAt.Value < now && r.Status == "Open")
                .ToList();

            foreach (var r in expired)
            {
                r.Status = "Expired";
                await _repo.UpdateMatchRequestAsync(r);
            }

            return expired.Count;
        }
    }
}