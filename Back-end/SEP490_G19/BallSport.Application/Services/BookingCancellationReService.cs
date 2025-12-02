using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Banking.Application.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BallSport.Application.Services
{
    public class BookingCancellationReService
    {
        private readonly BookingCancellationReRepository _requestRepository;
        private readonly BookingFieldsRepoitory _bookingRepository;
        private readonly PaymentRepository _paymentRepository;
        private readonly BookingCancellationRepository _cancellationRepository;
        private readonly EmailService _emailService;
        private readonly UserRepositories _userRepository;

        public BookingCancellationReService(BookingCancellationReRepository requestRepository, BookingFieldsRepoitory bookingRepository, PaymentRepository paymentRepository, BookingCancellationRepository cancellationRepository, EmailService emailService, UserRepositories userRepository)
        {
            _requestRepository = requestRepository;
            _bookingRepository = bookingRepository;
            _paymentRepository = paymentRepository;
            _cancellationRepository = cancellationRepository;
            _emailService = emailService;
            _userRepository = userRepository;
        }

        public async Task<List<BookingCancellationforGETDTO>> GetAllAsync()
        {
            var requests = await _requestRepository.GetAllAsync();
            return requests.Select(r => new BookingCancellationforGETDTO
            {
                RequestId = r.RequestId,
                BookingId = r.BookingId,
                RequestedByRole = r.RequestedByRole,
                RequestStatus = r.RequestStatus,
                RefundAmount = r.RefundAmount ?? 0,
                PenaltyAmount = r.PenaltyAmount ?? 0,
                FinalRefundAmount = r.FinalRefundAmount ?? 0,
                RequestedAt = r.RequestedAt,
                RequestReason = r.RequestReason
            }).ToList();
        }

        public async Task<BookingCancellationforGETDTO?> GetByIdAsync(int id)
        {
            var r = await _requestRepository.GetByIdAsync(id);
            if (r == null) return null;

            return new BookingCancellationforGETDTO
            {
                RequestId = r.RequestId,
                BookingId = r.BookingId,
                RequestedByRole = r.RequestedByRole,
                RequestStatus = r.RequestStatus,
                RefundAmount = r.RefundAmount ?? 0,
                PenaltyAmount = r.PenaltyAmount ?? 0,
                FinalRefundAmount = r.FinalRefundAmount ?? 0,
                RequestedAt = r.RequestedAt,
                RequestReason = r.RequestReason
            };
        }



        public async Task<object> CreateAsync(int bookingId, int requestedByUserId, string? reason = null)
        {
            var requestedByRole = await _userRepository.GetUserRoleAsync(requestedByUserId)
                ?? throw new Exception("Không xác định được vai trò của người yêu cầu.");

            var booking = await _bookingRepository.GetByIdAsync(bookingId)
                ?? throw new Exception("Không tìm thấy thông tin booking.");

            var now = DateTime.Now;
            var referenceTime = booking.ConfirmedAt ?? booking.CreatedAt ?? now;
            var diff = now - referenceTime;

            decimal baseDeposit = booking.DepositAmount;
            decimal refundPercent = 1.0m;
            decimal hourDiff = (decimal)diff.TotalHours;

            string penaltyReason = "Không bị phạt.";



            if (requestedByRole.Equals("Player", StringComparison.OrdinalIgnoreCase))
            {
                if (hourDiff <= 2)
                {
                    refundPercent = 1.0m;
                    penaltyReason = "Người chơi hủy trong 2 tiếng đầu sau khi đặt, được hoàn 100% tiền cọc.";
                }
                else
                {
                    decimal extraHours = hourDiff - 2;
                    int hours = (int)Math.Floor((double)extraHours);
                    int minutes = (int)Math.Round(((double)(extraHours - hours)) * 60);

                    string timeDelay = hours > 0 && minutes > 0
                        ? $"{hours} tiếng {minutes} phút"
                        : hours > 0
                            ? $"{hours} tiếng"
                            : $"{minutes} phút";

                    refundPercent = 1m - (0.3m * extraHours);

                    
                    if (refundPercent < 0m)
                        refundPercent = 0m;

                    decimal penaltyRate = 1m - refundPercent;
                    penaltyReason = $"Người chơi hủy trễ {timeDelay} tiếng so với giới hạn 2 tiếng đầu, bị phạt {penaltyRate * 100:N0}% tiền cọc.";
                }
            }
            else if (requestedByRole.Equals("Owner", StringComparison.OrdinalIgnoreCase))
            {
                if (hourDiff <= 2)
                {
                    refundPercent = 1.0m;
                    penaltyReason = "Chủ sân hủy trong 2 tiếng đầu sau khi xác nhận, không cần bồi thường thêm.";
                }
                else
                {
                    decimal extraHours = hourDiff - 2;

                    int hours = (int)Math.Floor((double)extraHours);
                    int minutes = (int)Math.Round(((double)(extraHours - hours)) * 60);

                    string timeDelay = hours > 0 && minutes > 0
                        ? $"{hours} tiếng {minutes} phút"
                        : hours > 0
                            ? $"{hours} tiếng"
                            : $"{minutes} phút";
                    refundPercent = 1m + (0.3m * extraHours);

                    // Giới hạn tối đa 200% (gấp đôi tiền cọc)
                    if (refundPercent > 2.0m)
                        refundPercent = 2.0m;

                    decimal bonusRate = refundPercent - 1m;
                    penaltyReason = $"Chủ sân hủy trễ {timeDelay} tiếng so với giới hạn 2 tiếng đầu, phải hoàn thêm {bonusRate * 100:N0}% tiền cọc cho người chơi.";
                }
            }


            // --- Tính toán tiền ---
            decimal refundAmount = Math.Round(baseDeposit, 2); 
            decimal finalRefundAmount = Math.Round(baseDeposit * refundPercent, 2);
            decimal penaltyAmount = Math.Round(Math.Abs(refundAmount - finalRefundAmount), 2);

            // --- Tạo yêu cầu ---
            var request = new BookingCancellationRequest
            {
                BookingId = bookingId,
                RequestedByUserId = requestedByUserId,
                RequestedByRole = requestedByRole,
                RequestReason = reason,
                RequestedAt = now,
                RequestStatus = "Pending",
                RefundAmount = refundAmount,
                PenaltyAmount = penaltyAmount,
                FinalRefundAmount = finalRefundAmount,
                UndoAllowedUntil = now.AddMinutes(5)
            };

            var createdRequest = await _requestRepository.CreateAsync(request);

            // --- SINH MÃ QR ---
            string qrUrl = await _paymentRepository.GenerateRefundVietQRAsync(booking.BookingId, finalRefundAmount);
            createdRequest.RequestReason = (reason ?? "") + $" | RefundQR: {qrUrl}";
            await _requestRepository.UpdateAsync(createdRequest);

            // --- GỬI EMAIL ---
            var recipientEmails = new List<string>();

            if (!string.IsNullOrEmpty(booking.User?.Email))
                recipientEmails.Add(booking.User.Email);

            string? ownerEmail = null;
            if (booking.Schedule?.Field?.Complex?.OwnerId != null)
            {
                var ownerUser = await _userRepository.GetByIdAsync(booking.Schedule.Field.Complex.OwnerId.Value);
                if (ownerUser != null && !string.IsNullOrEmpty(ownerUser.Email))
                    ownerEmail = ownerUser.Email;
            }

            if (!string.IsNullOrEmpty(ownerEmail))
                recipientEmails.Add(ownerEmail);

            string subject = $"Thông báo hủy sân #{booking.BookingId}";
            string message = $@"
        <b>Yêu cầu hủy sân từ {requestedByRole}</b><br/>
        Ngày: {booking.Schedule?.Date.ToString("dd/MM/yyyy") ?? "N/A"}<br/>
        Lý do: {reason ?? "Không có lý do"}<br/><br/>
        Tiền cọc ban đầu: <b>{refundAmount:N0}đ</b><br/>
        Tiền phạt: <b>{penaltyAmount:N0}đ</b><br/>
        Số tiền hoàn lại: <b>{finalRefundAmount:N0}đ</b><br/>
        <i>{penaltyReason}</i><br/><br/>
        <a href='{qrUrl}'>Xem mã QR hoàn tiền</a><br/><br/>
        Trân trọng!";

            foreach (var email in recipientEmails)
            {
                if (!string.IsNullOrWhiteSpace(email))
                    await _emailService.SendEmailAsync(email, subject, message);
            }

            // --- Kết quả trả về ---
            return new
            {
                Message = "Yêu cầu hủy bởi "+ requestedByRole +" đã được gửi thành công",
                CancelReason = penaltyReason,
                RefundAmount = refundAmount,
                PenaltyAmount = penaltyAmount,
                FinalRefundAmount = finalRefundAmount,
                RefundQR = qrUrl
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var request = await _requestRepository.GetByIdAsync(id);
            if (request == null)
                throw new Exception("Không tìm thấy yêu cầu hủy.");

            if (request.RequestStatus != "Pending")
                throw new Exception("Không thể xóa yêu cầu đã được xử lý.");

            return await _requestRepository.DeleteAsync(id);
        }

        public async Task<BookingCancellationResponseDTO> ConfirmCancellationAsync(int requestId, int verifiedBy)
        {
            var request = await _requestRepository.GetByIdAsync(requestId)
                ?? throw new Exception("Không tìm thấy yêu cầu hủy.");

            if (request.RequestStatus != "Pending")
                throw new Exception("Yêu cầu này đã được xử lý.");

            var booking = await _bookingRepository.GetByIdAsync(request.BookingId)
                ?? throw new Exception("Không tìm thấy thông tin booking.");

            var cancellation = new BookingCancellation
            {
                BookingId = booking.BookingId,
                RequestId = request.RequestId,
                CancelledBy = request.RequestedByRole,
                CancelReason = request.RequestReason,
                RefundAmount = request.RefundAmount ?? 0,
                PenaltyAmount = request.PenaltyAmount ?? 0,
                CreatedAt = DateTime.Now,
                VerifiedBy = verifiedBy,
                VerifiedAt = DateTime.Now
            };

            await _cancellationRepository.CreateCancellationAsync(cancellation);

            booking.BookingStatus = "Cancelled";
            booking.CancelledAt = DateTime.Now;
            booking.CancelReason = request.RequestReason;
            await _bookingRepository.UpdateAsync(booking);

            request.RequestStatus = "Confirmed";
            request.ProcessedAt = DateTime.Now;
            await _requestRepository.UpdateAsync(request);

           
            return new BookingCancellationResponseDTO
            {
                CancellationId = cancellation.CancellationId,
                BookingId = booking.BookingId,
                RequestId = request.RequestId,
                CancelledBy = request.RequestedByRole,
                CancelReason = request.RequestReason,
                RefundAmount = request.RefundAmount ?? 0,
                PenaltyAmount = request.PenaltyAmount ?? 0,
                CreatedAt = cancellation.CreatedAt,
                VerifiedBy = verifiedBy,
                VerifiedAt = cancellation.VerifiedAt,
                BookingStatus = booking.BookingStatus,
                RequestStatus = request.RequestStatus
            };
        }

    }
}
