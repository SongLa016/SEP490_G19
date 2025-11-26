using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.Services
{
    public class MonthlyBookingService
    {
        private readonly BookingPackageRepository _bookingRepo;
        private readonly PaymentRepository _paymentRepo;
        private readonly MonthlyPackagePaymentRepo _monthlyPayment;
        private readonly PackageSessionRepository _packageSessionRepo;

        public MonthlyBookingService(BookingPackageRepository bookingRepo, PaymentRepository paymentRepo, MonthlyPackagePaymentRepo monthlyPayment, PackageSessionRepository packageSessionRepo)
        {
            _bookingRepo = bookingRepo;
            _paymentRepo = paymentRepo;
            _monthlyPayment = monthlyPayment;
            _packageSessionRepo = packageSessionRepo;
        }


        // ================= CREATE BOOKING PACKAGE ===================
        public async Task<BookingPackage> CreateBookingPackageAsync(BookingPackageCreateDto dto)
        {
            // 1) Tạo booking package
            var package = new BookingPackage
            {
                UserId = dto.UserId,
                FieldId = dto.FieldId,
                PackageName = dto.PackageName,
                StartDate = DateOnly.FromDateTime(dto.StartDate),
                EndDate = DateOnly.FromDateTime(dto.EndDate),
                TotalPrice = dto.TotalPrice,
                BookingStatus = "Pending",
                PaymentStatus = "Pending",
                CreatedAt = DateTime.Now
            };

            package = await _bookingRepo.CreateBookingPackageAsync(package);

           
            string qrUrl = await _paymentRepo.GenerateVietQRAsync(package.BookingPackageId);

            var expiresAt = DateTime.Now.AddMinutes(10);

            await _bookingRepo.UpdateQRCodeAsync(package.BookingPackageId, qrUrl, expiresAt);

            
            package.Qrcode = qrUrl;
            package.QrexpiresAt = expiresAt;

            return package;
        }


        // ================= CONFIRM BOOKING BY OWNER ===================
        public async Task<bool> ConfirmBookingByOwnerAsync(int packageId)
        {
            var package = await _bookingRepo.GetByIdAsync(packageId);
            if (package == null) return false;

            // 1) Update trạng thái
            package.BookingStatus = "Confirmed";
            package.PaymentStatus = "Paid";
            package.UpdatedAt = DateTime.Now;

            await _bookingRepo.UpdateStatusToConfirmedAsync(package.BookingPackageId);

            // 2) Tạo bản ghi thanh toán
            var payment = new MonthlyPackagePayment
            {
                BookingPackageId = package.BookingPackageId,
                UserId = package.UserId,
                Amount = package.TotalPrice,
                TotalSlots = package.PackageSessions.Count, // hoặc tính dựa trên business logic
                Status = "Paid",
                Method = "Manual",
                PaidAt = DateTime.Now,
                CreatedAt = DateTime.Now
            };
            await _monthlyPayment.CreatePaymentAsync(payment);

            // 3) Tạo các PackageSession
            var totalDays = (package.EndDate.ToDateTime(TimeOnly.MinValue) - package.StartDate.ToDateTime(TimeOnly.MinValue)).Days + 1;

            for (int i = 0; i < totalDays; i++)
            {
                var sessionDate = package.StartDate.ToDateTime(TimeOnly.MinValue).AddDays(i);
                var session = new PackageSession
                {
                    BookingPackageId = package.BookingPackageId,
                    UserId = package.UserId,
                    SessionDate = DateOnly.FromDateTime(sessionDate),
                    PricePerSession = package.TotalPrice / totalDays,
                    SessionStatus = "Pending",
                    CreatedAt = DateTime.Now
                };
                await _packageSessionRepo.CreatePackageSessionAsync(session);
            }

            return true;
        }

        public async Task<bool> CompleteBookingPackageAsync(int packageId)
        {
            return await _bookingRepo.CompleteBookingPackageAsync(packageId);
        }

        public async Task<string> CancelPackageSessionAsync(int sessionId)
        {
            // 1) Lấy session
            var session = await _packageSessionRepo.GetByIdAsync(sessionId);
            if (session == null) throw new Exception("Không tìm thấy buổi chơi.");

            // 2) Cập nhật trạng thái slot
            session.SessionStatus = "Cancelled";
            await _packageSessionRepo.CancelSessionAsync(sessionId);

            // 3) Lấy thông tin package để tính tiền 1 slot
            var package = await _bookingRepo.GetByIdAsync(session.BookingPackageId);
            if (package == null) throw new Exception("Không tìm thấy gói booking.");

            int totalSlots = package.PackageSessions.Count; // tổng số slot đã tạo
            decimal refundAmount = Math.Round(package.TotalPrice / totalSlots, 2);

            // 4) Tạo bản ghi thanh toán hoàn tiền
            var refundPayment = new MonthlyPackagePayment
            {
                BookingPackageId = package.BookingPackageId,
                UserId = session.UserId,
                Amount = refundAmount,
                TotalSlots = 1,
                Status = "Refund",
                Method = "Manual",
                PaidAt = DateTime.Now,
                CreatedAt = DateTime.Now
            };
            await _monthlyPayment.CreatePaymentAsync(refundPayment);

            // 5) Sinh mã QR hoàn tiền
            string qrUrl = await _paymentRepo.GenerateRefundVietQRAsync(session.BookingPackageId, refundAmount);

            return qrUrl; // trả về QR để chủ sân chuyển khoản
        }


    }




}
