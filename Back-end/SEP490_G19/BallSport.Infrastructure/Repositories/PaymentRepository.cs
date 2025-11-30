using BallSport.Infrastructure;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories
{
    public class PaymentRepository
    {
        private readonly Sep490G19v1Context _context;

        public PaymentRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        // Thêm bản ghi thanh toán mới
        public async Task<Payment> AddAsync(Payment payment)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return payment;
        }

        // Lấy thanh toán theo BookingID
        public async Task<Payment?> GetByBookingIdAsync(int bookingId)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.BookingId == bookingId);
        }

        public async Task<string> GenerateVietQRAsync(int bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Field)
                        .ThenInclude(f => f.BankAccount)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);

            if (booking == null)
                throw new Exception("Không tìm thấy booking.");

            var bankAccount = booking.Schedule?.Field?.BankAccount;
            if (bankAccount == null)
                throw new Exception("Không tìm thấy tài khoản ngân hàng của sân.");

            // ✅ Các thông tin hoàn toàn lấy động từ DB
            string bankShortCode = bankAccount.BankShortCode
                ?? throw new Exception("Thiếu mã ngân hàng (BankShortCode).");

            string accountNumber = bankAccount.AccountNumber
                ?? throw new Exception("Thiếu số tài khoản.");

            string accountHolder = bankAccount.AccountHolder
                ?? throw new Exception("Thiếu tên chủ tài khoản.");

            decimal amount = booking.DepositAmount;


            string addInfo = $"Booking #{booking.BookingId} Deposit";


            string qrUrl = $"https://img.vietqr.io/image/{bankShortCode}-{accountNumber}-compact2.jpg" +
                           $"?amount={amount}" +
                           $"&addInfo={Uri.EscapeDataString(addInfo)}" +
                           $"&accountName={Uri.EscapeDataString(accountHolder)}";

            return qrUrl;
        }



        public async Task<string> GenerateRefundVietQRAsync(int bookingId, decimal refundAmount)
        {
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId)
                ?? throw new Exception("Không tìm thấy booking.");

            var playerAccount = await _context.PlayerBankAccounts
                .FirstOrDefaultAsync(a => a.UserId == booking.UserId && a.IsDefault == true);

            if (playerAccount == null)
                throw new Exception("Người chơi chưa có tài khoản ngân hàng.");

            string bankShortCode = playerAccount.BankShortCode!;
            string accountNumber = playerAccount.AccountNumber!;
            string accountHolder = playerAccount.AccountHolder!;
            string addInfo = $"Refund for Booking #{booking.BookingId}";

            // ✅ Format tiền chuẩn, không bị dấu phẩy
            string amountString = refundAmount.ToString("0.##", CultureInfo.InvariantCulture);

            string qrUrl = $"https://img.vietqr.io/image/{bankShortCode}-{accountNumber}-compact2.jpg" +
                           $"?amount={amountString}" +
                           $"&addInfo={Uri.EscapeDataString(addInfo)}" +
                           $"&accountName={Uri.EscapeDataString(accountHolder)}";

            return qrUrl;
        }


        public async Task<string> GenerateVietQRForPackageAsync(int bookingPackageId, decimal amount)
        {
            var package = await _context.BookingPackages
                .Include(bp => bp.Field)
                    .ThenInclude(f => f.BankAccount)
                .FirstOrDefaultAsync(bp => bp.BookingPackageId == bookingPackageId);

            if (package == null)
                throw new Exception("Không tìm thấy booking package.");

            var bankAccount = package.Field?.BankAccount
                ?? throw new Exception("Không tìm thấy tài khoản ngân hàng của sân.");

            string bankShortCode = bankAccount.BankShortCode
                ?? throw new Exception("Thiếu mã ngân hàng (BankShortCode).");
            string accountNumber = bankAccount.AccountNumber
                ?? throw new Exception("Thiếu số tài khoản.");
            string accountHolder = bankAccount.AccountHolder
                ?? throw new Exception("Thiếu tên chủ tài khoản.");

            string addInfo = $"BookingPackage #{package.BookingPackageId}";

            // ✅ Sửa định dạng tiền: luôn dùng dấu chấm
            string amountString = amount.ToString("0.00", CultureInfo.InvariantCulture);

            string qrUrl = $"https://img.vietqr.io/image/{bankShortCode}-{accountNumber}-compact2.jpg" +
                           $"?amount={amountString}" +
                           $"&addInfo={Uri.EscapeDataString(addInfo)}" +
                           $"&accountName={Uri.EscapeDataString(accountHolder)}";

            return qrUrl;
        }



        public async Task<string> GenerateRefundVietQRAsync(int userId, decimal refundAmount, string info = "")
        {
            var playerAccount = await _context.PlayerBankAccounts
               .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault == true)
                ?? throw new Exception("Người chơi chưa có tài khoản ngân hàng.");

            string addInfo = string.IsNullOrEmpty(info) ? $"Refund for User #{userId}" : info;

            string amountString = refundAmount.ToString("0.##", CultureInfo.InvariantCulture);

            string qrUrl = $"https://img.vietqr.io/image/{playerAccount.BankShortCode}-{playerAccount.AccountNumber}-compact2.jpg" +
                           $"?amount={amountString}" +
                           $"&addInfo={Uri.EscapeDataString(addInfo)}" +
                           $"&accountName={Uri.EscapeDataString(playerAccount.AccountHolder)}";

            return qrUrl;
        }

        public async Task<string> GenerateRefundQRForSessionAsync(int userId, decimal refundAmount, string info = "")
        {
            // Lấy tài khoản ưu tiên (IsDefault = true), nếu không có thì lấy cái đầu tiên
            var playerAccount = await _context.PlayerBankAccounts
                .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault == true)
                ?? await _context.PlayerBankAccounts.FirstOrDefaultAsync(a => a.UserId == userId);

            if (playerAccount == null)
                throw new Exception("Người chơi chưa có tài khoản ngân hàng.");

            string addInfo = string.IsNullOrEmpty(info)
                ? $"Refund for User #{userId}"
                : info;

            // Format số tiền chuẩn, luôn dùng dấu chấm
            string amountString = refundAmount.ToString("0.##", CultureInfo.InvariantCulture);

            string qrUrl = $"https://img.vietqr.io/image/{playerAccount.BankShortCode}-{playerAccount.AccountNumber}-compact2.jpg" +
                           $"?amount={amountString}" +
                           $"&addInfo={Uri.EscapeDataString(addInfo)}" +
                           $"&accountName={Uri.EscapeDataString(playerAccount.AccountHolder)}";

            return qrUrl;
        }



    }
}