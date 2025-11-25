using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Banking.Application.Services;
using System;
using System.Globalization;


namespace BallSport.Application.Services
{
    public class BookingService
    {
        private readonly BookingFieldsRepoitory _bookingRepo;
        private readonly PaymentRepository _paymentRepo;
        private readonly EmailService _emailRepo;

        public BookingService(BookingFieldsRepoitory bookingRepo, PaymentRepository paymentRepo, EmailService emailRepo)
        {
            _bookingRepo = bookingRepo;
            _paymentRepo = paymentRepo;
            _emailRepo = emailRepo;
        }

        public async Task<Booking> CreateBookingAsync(BookingCreateDto dto)
        {
            // 1. tạo booking
            var booking = new Booking
            {
                UserId = dto.UserId,
                ScheduleId = dto.ScheduleId,
                TotalPrice = dto.TotalPrice,
                DepositAmount = dto.DepositAmount,
                RemainingAmount = dto.TotalPrice - dto.DepositAmount,
                BookingStatus = "Pending",
                PaymentStatus = "Unpaid",
                HasOpponent = dto.HasOpponent,
                CreatedAt = DateTime.Now
            };

            booking = await _bookingRepo.AddAsync(booking);


            string qrUrl = await _paymentRepo.GenerateVietQRAsync(booking.BookingId);

            // 3. lưu QR và expires vào DB (10 phút)
            var expiresAt = DateTime.Now.AddMinutes(10);
            await _bookingRepo.UpdateQRCodeAsync(booking.BookingId, qrUrl, expiresAt);

            // 4. cập nhật object trả về (tùy nếu bạn muốn)
            booking.Qrcode = qrUrl;
            booking.QrexpiresAt = expiresAt;

            return booking;
        }


        public async Task<bool> ConfirmPaymentManualAsync(int bookingId, decimal amount)
        {
            // Cập nhật booking + sân
            var success = await _bookingRepo.ConfirmPaymentManualAsync(bookingId);
            if (!success) return false;

            var booking = await _bookingRepo.GetByIdAsync(bookingId);
            // Thêm record vào Payments
            var payment = new Payment
            {
                BookingId = bookingId,
                Amount = amount,
                Status = "Paid",
                CreatedAt = DateTime.Now,
                Method = "Manual",
                PaymentType = "Deposit",
                TransactionCode = $"MANUAL-{Guid.NewGuid().ToString().Substring(0, 8)}",
                OrderCode = $"ManualConfirm_{Guid.NewGuid().ToString().Substring(0, 8)}",
                PayOrderInfo = $"Thanh toán cọc cho sân {booking.Schedule?.Field?.Name}, slot {booking.Schedule?.Slot?.StartTime:HH:mm}-{booking.Schedule?.Slot?.EndTime:HH:mm}",
                PaidAt = DateTime.Now
            };


            if (booking?.User?.Email != null)
            {
                string subject = "Xác nhận thanh toán cọc";
                string message = $"Chào {booking.User.FullName},<br/><br/>" +
                                 $"Chúng tôi đã nhận được **tiền cọc {amount:C}** từ bạn cho booking sân <b>{booking.Schedule.Field.Name}</b> trong khu sân <b>{booking.Schedule.Field.Complex.Name}</b>.<br/>" +
                                 $"Cảm ơn bạn đã lựa chọn FieldComplexes của chúng tôi.<br/><br/>" +
                                 $"Trân trọng,<br/>{booking.Schedule.Field.Complex.Name}";
                await _emailRepo.SendEmailAsync(booking.User.Email, subject, message);
            }

            await _paymentRepo.AddAsync(payment);
            return true;
        }


        public async Task<string> GeneratePaymentRequestAsync(int bookingId)
        {

            var booking = await _bookingRepo.GetBookingWithBankAsync(bookingId)
                          ?? throw new Exception("Không tìm thấy booking.");

            if (booking.RemainingAmount <= 0)
                throw new Exception("Booking này không còn tiền cần thanh toán.");

            var bank = booking.Schedule.Field.BankAccount
                       ?? throw new Exception("Không tìm thấy tài khoản ngân hàng của sân.");

            string addInfo = $"Chuyen khoan tien san {booking.Schedule.Field.Name} {booking.Schedule.Slot.StartTime}";
            string amountString = (booking.RemainingAmount ?? 0).ToString("0.##", CultureInfo.InvariantCulture);

            string qrUrl = $"https://img.vietqr.io/image/{bank.BankShortCode}-{bank.AccountNumber}-compact2.jpg" +
                           $"?amount={amountString}" +
                           $"&addInfo={Uri.EscapeDataString(addInfo)}" +
                           $"&accountName={Uri.EscapeDataString(bank.AccountHolder)}";


            var expiresAt = DateTime.Now.AddMinutes(10);
            await _bookingRepo.UpdateQRCodeAsync(booking.BookingId, qrUrl, expiresAt);


            booking.Qrcode = qrUrl;
            booking.QrexpiresAt = expiresAt;

            return qrUrl;
        }


        public async Task<bool> ConfirmBookingByOwnerAsync(int bookingId)
        {
            // Chỉ gọi repo xác nhận, repo đã làm đủ việc update trạng thái
            var success = await _bookingRepo.CompleteBookingAsync(bookingId);
            if (!success)
                throw new Exception("Xác nhận booking thất bại hoặc không tìm thấy booking.");
            var booking = await _bookingRepo.GetByIdAsync(bookingId);

            var payment = new Payment
            {
                BookingId = booking.BookingId,
                Amount = booking.RemainingAmount ?? 0m,
                Status = "Success",
                Method = "VNPay",
                PaymentType = "Remaining",
                CreatedAt = DateTime.Now,
                TransactionCode = $"MANUAL-{Guid.NewGuid().ToString().Substring(0, 8)}",
                OrderCode = $"ManualConfirm_{Guid.NewGuid().ToString().Substring(0, 8)}",
                PayOrderInfo = $"Thanh toán phần còn lại cho sân {booking.Schedule?.Field?.Name}, slot {booking.Schedule?.Slot?.StartTime:HH:mm}-{booking.Schedule?.Slot?.EndTime:HH:mm}"
            };

            await _paymentRepo.AddAsync(payment);


            if (booking?.User?.Email != null && booking.Schedule != null)
            {
                var slot = booking.Schedule.Slot;
                var field = booking.Schedule.Field;
                var complex = field?.Complex;

                string subject = "Booking đã được xác nhận";
                string message = $"Chào {booking.User.FullName},<br/><br/>" +
                                 $"Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi.<br/>" +
                                 $"Booking slot <b>{slot?.StartTime:HH:mm} - {slot?.EndTime:HH:mm}</b> " +
                                 $"của sân <b>{field?.Name}</b> trong khu sân <b>{complex?.Name}</b> " +
                                 $"đã được <b>thanh toán đầy đủ</b>.<br/><br/>" +
                                 $"Trân trọng cảm ơn,<br/>{complex?.Name}";

                await _emailRepo.SendEmailAsync(booking.User.Email, subject, message);
            }

            return true;
        }


        public async Task<List<BookingUsDTO>> GetBookingsByUserIdAsync(int userId)
        {
            var bookings = await _bookingRepo.GetBookingsByUserIdAsync(userId);

            var result = bookings.Select(b => new BookingUsDTO
            {
                BookingId = b.BookingId,
                UserId = b.UserId,
                ScheduleId = b.ScheduleId,

                TotalPrice = b.TotalPrice,
                DepositAmount = b.DepositAmount,
                RemainingAmount = b.RemainingAmount,

                BookingStatus = b.BookingStatus,
                PaymentStatus = b.PaymentStatus,
                HasOpponent = b.HasOpponent,

                CreatedAt = b.CreatedAt,
                ConfirmedAt = b.ConfirmedAt,
                CancelledAt = b.CancelledAt,
                CancelledBy = b.CancelledBy,
                CancelReason = b.CancelReason,

                
                FieldName = b.Schedule.Field.Name,
                ComplexName = b.Schedule.Field.Complex.Name,
                SlotName = b.Schedule.Slot.SlotName
                            ?? $"{b.Schedule.Slot.StartTime:HH:mm}-{b.Schedule.Slot.EndTime:HH:mm}",

                StartTime = DateTime.Today.Add(b.Schedule.Slot.StartTime.ToTimeSpan()),
                EndTime = DateTime.Today.Add(b.Schedule.Slot.EndTime.ToTimeSpan())
            }).ToList();

            return result;
        }

        public async Task<List<BookingUsDTO>> GetBookingsByOwnerUserIdAsync(int userId)
        {
            var bookings = await _bookingRepo.GetBookingsByOwnerUserIdAsync(userId);

            var result = bookings.Select(b => new BookingUsDTO
            {
                BookingId = b.BookingId,
                UserId = b.UserId,
                ScheduleId = b.ScheduleId,

                TotalPrice = b.TotalPrice,
                DepositAmount = b.DepositAmount,
                RemainingAmount = b.RemainingAmount,

                BookingStatus = b.BookingStatus,
                PaymentStatus = b.PaymentStatus,
                HasOpponent = b.HasOpponent,

                CreatedAt = b.CreatedAt,
                ConfirmedAt = b.ConfirmedAt,
                CancelledAt = b.CancelledAt,
                CancelledBy = b.CancelledBy,
                CancelReason = b.CancelReason,

                // Thông tin sân
                FieldName = b.Schedule.Field.Name,
                ComplexName = b.Schedule.Field.Complex.Name,
                SlotName = b.Schedule.Slot.SlotName
                            ?? $"{b.Schedule.Slot.StartTime:HH:mm}-{b.Schedule.Slot.EndTime:HH:mm}",

                StartTime = DateTime.Today.Add(b.Schedule.Slot.StartTime.ToTimeSpan()),
                EndTime = DateTime.Today.Add(b.Schedule.Slot.EndTime.ToTimeSpan())
            }).ToList();

            return result;
        }






    }
}