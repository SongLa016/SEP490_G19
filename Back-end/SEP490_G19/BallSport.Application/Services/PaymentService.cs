using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class PaymentService
    {
        private readonly IPaymentRepository _paymentRepo;
        private readonly IBookingRepository _bookingRepo;
        private readonly PayOsService _payos;

        public PaymentService(IPaymentRepository paymentRepo, IBookingRepository bookingRepo, PayOsService payos)
        {
            _paymentRepo = paymentRepo;
            _bookingRepo = bookingRepo;
            _payos = payos;
        }

        public async Task<Payment> CreatePaymentAsync(PaymentCreateDto dto)
        {
            var orderCode = $"BOOK-{dto.BookingId}-{DateTime.UtcNow.Ticks}";

            var payment = new Payment
            {
                BookingId = dto.BookingId,
                OwnerId = dto.OwnerId,
                Amount = dto.Amount,
                Method = dto.Method,
                Status = "Pending",
                OrderCode = orderCode,
                CreatedAt = DateTime.UtcNow
            };

            // Gọi API PayOS thật để tạo QR động
            var qrResult = await _payos.CreatePaymentQRCodeAsync(dto.BookingId, dto.Amount, dto.FieldId);
            payment.PayUrl = qrResult.Code;


            await _paymentRepo.AddAsync(payment);
            await _paymentRepo.SaveChangesAsync();

            return payment;
        }
        public async Task<bool> ConfirmPaymentAsync(string orderCode, string status, string checksum)
        {
            // 1️⃣ Xác minh checksum từ PayOS
            bool isValid = _payos.VerifyChecksum(orderCode, status, checksum);
            if (!isValid)
                throw new Exception("Invalid PayOS checksum.");

            // 2️⃣ Tìm giao dịch theo mã đơn hàng
            var payment = await _paymentRepo.GetByOrderCodeAsync(orderCode);
            if (payment == null)
                throw new Exception($"Payment with order code {orderCode} not found.");

            // 3️⃣ Cập nhật trạng thái thanh toán
            if (status == "PAID" || status == "SUCCESS")
            {
                payment.Status = "Success";
                payment.PaidAt = DateTime.UtcNow;

                // Cập nhật trạng thái đặt sân tương ứng
                if (payment.BookingId.HasValue)
                {
                    var booking = await _bookingRepo.GetByIdAsync(payment.BookingId.Value);
                    if (booking != null)
                    {
                        booking.BookingStatus = "Paid";
                        await _bookingRepo.UpdateAsync(booking);
                    }
                }
            }
            else
            {
                payment.Status = "Failed";
            }

            await _paymentRepo.UpdateAsync(payment);
            await _paymentRepo.SaveChangesAsync();

            return true;
        }
    }
}
