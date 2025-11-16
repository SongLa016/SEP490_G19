using BallSport.Application.DTOs.MatchFinding;
using BallSport.Application.Services.Community;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.MatchFinding;

namespace BallSport.Application.Services.MatchFinding
{
    public class MatchRequestService : IMatchRequestService
    {
        private readonly IMatchRequestRepository _matchRequestRepository;
        private readonly IMatchParticipantRepository _participantRepository;
        private readonly INotificationService _notificationService;

        public MatchRequestService(
            IMatchRequestRepository matchRequestRepository,
            IMatchParticipantRepository participantRepository,
            INotificationService notificationService)
        {
            _matchRequestRepository = matchRequestRepository;
            _participantRepository = participantRepository;
            _notificationService = notificationService;
        }

        public async Task<(IEnumerable<MatchRequestDTO> Requests, int TotalCount)> GetAllMatchRequestsAsync(
            int pageNumber,
            int pageSize,
            MatchFilterDTO? filter = null)
        {
            var (requests, totalCount) = await _matchRequestRepository.GetAllMatchRequestsAsync(
                pageNumber,
                pageSize,
                filter?.Status,
                filter?.FromDate,
                filter?.ToDate,
                filter?.FieldId
            );

            var requestDtos = new List<MatchRequestDTO>();
            foreach (var request in requests)
            {
                var participantCount = await _participantRepository.CountParticipantsByMatchRequestIdAsync(request.MatchRequestId);
                requestDtos.Add(MapToMatchRequestDTO(request, participantCount));
            }

            return (requestDtos, totalCount);
        }

        public async Task<MatchRequestDetailDTO?> GetMatchRequestDetailAsync(int matchRequestId)
        {
            var request = await _matchRequestRepository.GetMatchRequestByIdAsync(matchRequestId);
            if (request == null)
                return null;

            var participants = await _participantRepository.GetParticipantsByMatchRequestIdAsync(matchRequestId);

            return MapToMatchRequestDetailDTO(request, participants);
        }

        public async Task<MatchRequestDTO> CreateMatchRequestAsync(CreateMatchRequestDTO createDto, int userId)
        {
            // Kiểm tra booking đã có yêu cầu chưa
            var hasRequest = await _matchRequestRepository.BookingHasMatchRequestAsync(createDto.BookingId);
            if (hasRequest)
                throw new Exception("Booking này đã có yêu cầu tìm đối thủ");

            // Tạo MatchRequest
            var matchRequest = new MatchRequest
            {
                BookingId = createDto.BookingId,
                CreatedBy = userId,
                Description = createDto.Description
            };

            var createdRequest = await _matchRequestRepository.CreateMatchRequestAsync(matchRequest);

            // Tạo participant cho chính người tạo (IsCreator = true)
            var creatorParticipant = new MatchParticipant
            {
                MatchRequestId = createdRequest.MatchRequestId,
                UserId = userId,
                IsCreator = true
            };
            await _participantRepository.AddParticipantAsync(creatorParticipant);

            // Load lại để có đầy đủ thông tin
            var fullRequest = await _matchRequestRepository.GetMatchRequestByIdAsync(createdRequest.MatchRequestId);

            return MapToMatchRequestDTO(fullRequest!, 1);
        }

        public async Task<bool> CancelMatchRequestAsync(int matchRequestId, int userId)
        {
            var matchRequest = await _matchRequestRepository.GetMatchRequestByIdAsync(matchRequestId);
            if (matchRequest == null || matchRequest.CreatedBy != userId)
                return false;

            // Chỉ cho phép hủy nếu status = Open hoặc Pending
            if (matchRequest.Status != "Open" && matchRequest.Status != "Pending")
                throw new Exception("Không thể hủy yêu cầu đã matched hoặc đã hủy");

            await _matchRequestRepository.UpdateMatchRequestStatusAsync(matchRequestId, "Cancelled");

            // Thông báo cho những người đã join
            var participants = await _participantRepository.GetParticipantsByMatchRequestIdAsync(matchRequestId);
            foreach (var participant in participants.Where(p => p.IsCreator == true))
            {
                await _notificationService.CreateNotificationAsync(new DTOs.Community.CreateNotificationDTO
                {
                    UserId = participant.UserId,
                    Type = "System",
                    TargetId = matchRequestId,
                    Message = "Yêu cầu tìm đối thủ đã bị hủy bởi chủ sân"
                });
            }

            return true;
        }

        public async Task<ParticipantDTO> JoinMatchAsync(JoinMatchRequestDTO joinDto, int userId)
        {
            var matchRequest = await _matchRequestRepository.GetMatchRequestByIdAsync(joinDto.MatchRequestId);
            if (matchRequest == null)
                throw new Exception("Không tìm thấy yêu cầu tìm đối thủ");

            // Kiểm tra trạng thái
            if (matchRequest.Status != "Open")
                throw new Exception("Yêu cầu này không còn mở để tham gia");

            // Kiểm tra đã join chưa
            var hasJoined = await _participantRepository.HasUserJoinedAsync(joinDto.MatchRequestId, userId);
            if (hasJoined)
                throw new Exception("Bạn đã gửi yêu cầu tham gia trận này rồi");

            // Kiểm tra xung đột thời gian
            var scheduleDate = matchRequest.Booking.Schedule.Date;
            var scheduleSlotId = matchRequest.Booking.Schedule.SlotId;

            if (!scheduleSlotId.HasValue)
                throw new Exception("Thông tin slot không hợp lệ");

            var hasConflict = await _participantRepository.HasTimeConflictAsync(
                userId,
                scheduleDate.ToDateTime(TimeOnly.MinValue),
                scheduleSlotId.Value
            );
            if (hasConflict)
                throw new Exception("Bạn đã có trận đấu khác trùng thời gian này");

            // Thêm participant
            var participant = new MatchParticipant
            {
                MatchRequestId = joinDto.MatchRequestId,
                UserId = userId,
                IsCreator = false
            };

            var addedParticipant = await _participantRepository.AddParticipantAsync(participant);

            // Đổi status thành Pending
            await _matchRequestRepository.UpdateMatchRequestStatusAsync(joinDto.MatchRequestId, "Pending");

            // Gửi thông báo cho chủ sân
            await _notificationService.CreateNotificationAsync(new DTOs.Community.CreateNotificationDTO
            {
                UserId = matchRequest.CreatedBy,
                Type = "System",
                TargetId = joinDto.MatchRequestId,
                Message = "Có đội muốn tham gia trận đấu của bạn"
            });

            return MapToParticipantDTO(addedParticipant);
        }

        public async Task<MatchRequestDTO?> RespondToJoinRequestAsync(
            int matchRequestId,
            RespondMatchRequestDTO respondDto,
            int userId)
        {
            var matchRequest = await _matchRequestRepository.GetMatchRequestByIdAsync(matchRequestId);
            if (matchRequest == null || matchRequest.CreatedBy != userId)
                throw new Exception("Bạn không có quyền xử lý yêu cầu này");

            var participant = await _participantRepository.GetParticipantByIdAsync(respondDto.ParticipantId);
            if (participant == null || participant.MatchRequestId != matchRequestId)
                throw new Exception("Không tìm thấy người tham gia");

            if (respondDto.Action == "Accept")
            {
                // Chấp nhận → Matched
                await _matchRequestRepository.UpdateMatchRequestStatusAsync(matchRequestId, "Matched");

                // Thông báo cho người được chấp nhận
                await _notificationService.CreateNotificationAsync(new DTOs.Community.CreateNotificationDTO
                {
                    UserId = participant.UserId,
                    Type = "System",
                    TargetId = matchRequestId,
                    Message = "Yêu cầu tham gia trận đấu của bạn đã được chấp nhận"
                });

                // Từ chối tất cả người khác (nếu có)
                var allParticipants = await _participantRepository.GetParticipantsByMatchRequestIdAsync(matchRequestId);
                foreach (var otherParticipant in allParticipants.Where(p => p.ParticipantId != respondDto.ParticipantId && p.IsCreator == true))
                {
                    await _participantRepository.RemoveParticipantAsync(otherParticipant.ParticipantId);
                    await _notificationService.CreateNotificationAsync(new DTOs.Community.CreateNotificationDTO
                    {
                        UserId = otherParticipant.UserId,
                        Type = "System",
                        TargetId = matchRequestId,
                        Message = "Yêu cầu tham gia trận đấu của bạn đã bị từ chối"
                    });
                }
            }
            else // Reject
            {
                // Xóa participant
                await _participantRepository.RemoveParticipantAsync(respondDto.ParticipantId);

                // Thông báo
                await _notificationService.CreateNotificationAsync(new DTOs.Community.CreateNotificationDTO
                {
                    UserId = participant.UserId,
                    Type = "System",
                    TargetId = matchRequestId,
                    Message = "Yêu cầu tham gia trận đấu của bạn đã bị từ chối"
                });

                // Kiểm tra còn người nào chờ không, nếu không thì đổi về Open
                var remainingParticipants = await _participantRepository.GetParticipantsByMatchRequestIdAsync(matchRequestId);
                if (remainingParticipants.Count(p => p.IsCreator == true) == 0)
                {
                    await _matchRequestRepository.UpdateMatchRequestStatusAsync(matchRequestId, "Open");
                }
            }

            var updatedRequest = await _matchRequestRepository.GetMatchRequestByIdAsync(matchRequestId);
            var participantCount = await _participantRepository.CountParticipantsByMatchRequestIdAsync(matchRequestId);

            return MapToMatchRequestDTO(updatedRequest!, participantCount);
        }

        public async Task<IEnumerable<MyMatchDTO>> GetMyMatchesAsync(int userId)
        {
            var participations = await _participantRepository.GetUserParticipationsAsync(userId);

            var myMatches = new List<MyMatchDTO>();

            foreach (var p in participations)
            {
                var allParticipants = await _participantRepository.GetParticipantsByMatchRequestIdAsync(p.MatchRequestId);

                var myMatch = new MyMatchDTO
                {
                    MatchRequestId = p.MatchRequestId,
                    Role = (p.IsCreator ?? false) ? "Creator" : "Joiner",
                    Status = p.MatchRequest.Status,
                    OpponentName = (p.IsCreator ?? false)
                        ? allParticipants.FirstOrDefault(pp => pp.IsCreator == false)?.User?.FullName
                        : p.MatchRequest.CreatedByNavigation?.FullName,
                    OpponentPhone = (p.IsCreator ?? false)
                        ? allParticipants.FirstOrDefault(pp => pp.IsCreator == false)?.User?.Phone
                        : p.MatchRequest.CreatedByNavigation?.Phone,
                    MatchDate = p.MatchRequest.Booking.Schedule.Date.ToDateTime(TimeOnly.MinValue),
                    TimeSlot = $"{p.MatchRequest.Booking.Schedule.Slot.StartTime:hh\\:mm} - {p.MatchRequest.Booking.Schedule.Slot.EndTime:hh\\:mm}",
                    FieldName = p.MatchRequest.Booking.Schedule.Field.Name,
                    FieldAddress = p.MatchRequest.Booking.Schedule.Field.Complex.Address,
                    CreatedAt = p.JoinedAt
                };

                myMatches.Add(myMatch);
            }

            return myMatches;
        }

        public async Task<IEnumerable<MatchRequestDTO>> GetMyMatchRequestsAsync(int userId)
        {
            var requests = await _matchRequestRepository.GetMatchRequestsByUserIdAsync(userId);

            var requestDtos = new List<MatchRequestDTO>();
            foreach (var request in requests)
            {
                var participantCount = await _participantRepository.CountParticipantsByMatchRequestIdAsync(request.MatchRequestId);
                requestDtos.Add(MapToMatchRequestDTO(request, participantCount));
            }

            return requestDtos;
        }

        public async Task<MatchStatsDTO> GetMatchStatisticsAsync(int? userId = null)
        {
            var stats = await _matchRequestRepository.GetMatchRequestStatisticsAsync(userId);

            var myMatches = 0;
            if (userId.HasValue)
            {
                var participations = await _participantRepository.GetUserParticipationsAsync(userId.Value);
                myMatches = participations.Count(p => p.MatchRequest.Status == "Matched");
            }

            return new MatchStatsDTO
            {
                TotalRequests = stats["Total"],
                OpenRequests = stats["Open"],
                PendingRequests = stats["Pending"],
                MatchedRequests = stats["Matched"],
                CancelledRequests = stats["Cancelled"],
                ExpiredRequests = stats["Expired"],
                MyMatches = myMatches
            };
        }

        public async Task<int> AutoExpireMatchRequestsAsync(int hoursToExpire = 1)
        {
            var expiredRequests = await _matchRequestRepository.GetExpiredMatchRequestsAsync(hoursToExpire);

            var count = 0;
            foreach (var request in expiredRequests)
            {
                await _matchRequestRepository.UpdateMatchRequestStatusAsync(request.MatchRequestId, "Expired");

                // Thông báo cho tất cả người liên quan
                var participants = await _participantRepository.GetParticipantsByMatchRequestIdAsync(request.MatchRequestId);
                foreach (var participant in participants)
                {
                    await _notificationService.CreateNotificationAsync(new DTOs.Community.CreateNotificationDTO
                    {
                        UserId = participant.UserId,
                        Type = "System",
                        TargetId = request.MatchRequestId,
                        Message = "Yêu cầu tìm đối thủ đã hết hạn do không được xác nhận"
                    });
                }

                count++;
            }

            return count;
        }

        public async Task<bool> BookingHasMatchRequestAsync(int bookingId)
        {
            return await _matchRequestRepository.BookingHasMatchRequestAsync(bookingId);
        }

        // ===== HELPER MAPPING METHODS =====

        private MatchRequestDTO MapToMatchRequestDTO(MatchRequest request, int participantCount)
        {
            DateTime? matchDate = null;
            if (request.Booking?.Schedule?.Date != null)
            {
                matchDate = request.Booking.Schedule.Date.ToDateTime(TimeOnly.MinValue);
            }

            return new MatchRequestDTO
            {
                MatchRequestId = request.MatchRequestId,
                BookingId = request.BookingId,
                CreatedBy = request.CreatedBy,
                CreatorName = request.CreatedByNavigation?.FullName ?? "Unknown",
                CreatorPhone = request.CreatedByNavigation?.Phone,
                Description = request.Description,
                Status = request.Status,
                CreatedAt = request.CreatedAt,
                FieldId = request.Booking?.Schedule?.FieldId,
                FieldName = request.Booking?.Schedule?.Field?.Name,
                FieldComplexName = request.Booking?.Schedule?.Field?.Complex?.Name,
                FieldAddress = request.Booking?.Schedule?.Field?.Complex?.Address,
                MatchDate = matchDate,
                TimeSlot = request.Booking?.Schedule?.Slot != null
                    ? $"{request.Booking.Schedule.Slot.StartTime:hh\\:mm} - {request.Booking.Schedule.Slot.EndTime:hh\\:mm}"
                    : null,
                TotalPrice = request.Booking?.TotalPrice,
                ParticipantCount = participantCount
            };
        }

        private MatchRequestDetailDTO MapToMatchRequestDetailDTO(MatchRequest request, IEnumerable<MatchParticipant> participants)
        {
            // Kiểm tra null cho các đối tượng quan trọng
            if (request.Booking?.Schedule == null)
                throw new Exception("Booking hoặc Schedule không hợp lệ");

            var booking = request.Booking;
            var schedule = booking.Schedule;
            var field = schedule.Field;

            return new MatchRequestDetailDTO
            {
                MatchRequestId = request.MatchRequestId,
                BookingId = request.BookingId,
                CreatedBy = request.CreatedBy,
                CreatorName = request.CreatedByNavigation?.FullName ?? "Unknown",
                CreatorAvatar = request.CreatedByNavigation?.Avatar != null
                    ? Convert.ToBase64String(request.CreatedByNavigation.Avatar)
                    : null,
                CreatorPhone = request.CreatedByNavigation?.Phone,
                Description = request.Description,
                Status = request.Status,
                CreatedAt = request.CreatedAt,
                BookingInfo = new BookingInfoDTO
                {
                    BookingId = booking.BookingId,
                    FieldId = schedule.FieldId ?? 0,
                    FieldName = field?.Name ?? "",
                    FieldType = field?.Type?.TypeName ?? "",
                    FieldSize = field?.Size ?? "",
                    FieldComplexName = field?.Complex?.Name ?? "",
                    FieldAddress = field?.Complex?.Address ?? "",
                    MatchDate = schedule.Date.ToDateTime(TimeOnly.MinValue),
                    TimeSlot = schedule.Slot != null
                        ? $"{schedule.Slot.StartTime:hh\\:mm} - {schedule.Slot.EndTime:hh\\:mm}"
                        : "",
                    TotalPrice = booking.TotalPrice,
                    BookingStatus = booking.BookingStatus ?? ""
                },
                Participants = participants.Select(MapToParticipantDTO).ToList()
            };
        }

        private ParticipantDTO MapToParticipantDTO(MatchParticipant participant)
        {
            return new ParticipantDTO
            {
                ParticipantId = participant.ParticipantId,
                UserId = participant.UserId,
                UserName = participant.User?.FullName ?? "Unknown",
                UserAvatar = participant.User?.Avatar != null
                    ? Convert.ToBase64String(participant.User.Avatar)
                    : null,
                UserPhone = participant.User?.Phone,
                TeamInfo = null,
                IsCreator = participant.IsCreator ?? false,
                JoinedAt = participant.JoinedAt
            };
        }
    }
}