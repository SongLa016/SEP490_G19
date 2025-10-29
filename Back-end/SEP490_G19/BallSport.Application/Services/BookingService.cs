using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class BookingService
    {
        private readonly IBookingRepository _bookingRepo;
        private readonly IFieldScheduleRepository _scheduleRepo;
        private readonly PayOsService _payos;

        public BookingService(
            IBookingRepository bookingRepo,
            IFieldScheduleRepository scheduleRepo,
            PayOsService payos)
        {
            _bookingRepo = bookingRepo;
            _scheduleRepo = scheduleRepo;
            _payos = payos;
        }

        // Tạo booking mới
        public async Task<BookingDto> CreateBookingAsync(BookingCreateDto dto)
        {
            var schedule = await _scheduleRepo.GetByIdAsync(dto.ScheduleId);
            if (schedule == null) throw new Exception("Không tìm thấy lịch sân");
            if (schedule.Status == "Booked") throw new Exception("Slot đã được đặt");

            var booking = new Booking
            {
                UserId = dto.UserId,
                ScheduleId = dto.ScheduleId,
                TotalPrice = dto.TotalPrice,
                DepositAmount = dto.DepositAmount,
                RemainingAmount = dto.TotalPrice - dto.DepositAmount,
                BookingStatus = "Pending",
                PaymentStatus = "Unpaid",
                HasOpponent = dto.HasOpponent ?? false,
                CreatedAt = DateTime.UtcNow
            };

            // Lưu booking tạm thời
            await _bookingRepo.AddAsync(booking);
            await _bookingRepo.SaveChangesAsync();

            // Tạo QR code từ PayOS
            if (schedule.FieldId == null)
                throw new Exception("FieldId của lịch sân chưa được gán.");

            var qrCode = await _payos.CreatePaymentQRCodeAsync(
                booking.BookingId,
                booking.TotalPrice,
                schedule.FieldId.Value
            );
            booking.Qrcode = qrCode.Code;
            booking.QrexpiresAt = qrCode.ExpiresAt;

            booking.Qrcode = qrCode.Code;
            booking.QrexpiresAt = qrCode.ExpiresAt;
            await _bookingRepo.SaveChangesAsync();

            return MapToDto(booking);
        }

        // Lấy tất cả booking
        public async Task<List<BookingDto>> GetAllBookingsAsync()
        {
            var bookings = await _bookingRepo.GetAllAsync();
            return bookings.Select(MapToDto).ToList();
        }

        // Callback từ PayOS
        public async Task HandlePayOsCallbackAsync(int bookingId, string paymentStatus)
        {
            var booking = await _bookingRepo.GetByIdAsync(bookingId);
            if (booking == null) throw new Exception("Booking không tồn tại");

            if (paymentStatus == "Success")
            {
                booking.PaymentStatus = "Paid";
                booking.BookingStatus = "Confirmed";

                var schedule = await _scheduleRepo.GetByIdAsync(booking.ScheduleId);
                if (schedule != null)
                {
                    schedule.Status = "Booked";
                    await _scheduleRepo.SaveChangesAsync();
                }
            }
            else
            {
                booking.PaymentStatus = "Failed";
                booking.BookingStatus = "Cancelled";
            }

            await _bookingRepo.SaveChangesAsync();
        }

        // Helper map entity -> DTO, xử lý nullable
        private BookingDto MapToDto(Booking booking) => new BookingDto
        {
            BookingId = booking.BookingId,
            UserId = booking.UserId,
            ScheduleId = booking.ScheduleId,
            TotalPrice = booking.TotalPrice,
            DepositAmount = booking.DepositAmount,
            RemainingAmount = booking.RemainingAmount ?? 0,
            BookingStatus = booking.BookingStatus ?? "Pending",
            PaymentStatus = booking.PaymentStatus ?? "Unpaid",
            HasOpponent = booking.HasOpponent ?? false,
            QRCode = booking.Qrcode ?? "",
            QRExpiresAt = booking.QrexpiresAt ?? DateTime.UtcNow.AddMinutes(15),
            CreatedAt = booking.CreatedAt ?? DateTime.UtcNow,
            ConfirmedAt = booking.ConfirmedAt ?? DateTime.MinValue,

        };
    }
}
