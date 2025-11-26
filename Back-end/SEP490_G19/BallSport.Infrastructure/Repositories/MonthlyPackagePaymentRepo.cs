using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories
{
    public class MonthlyPackagePaymentRepo
    {
        private readonly Sep490G19v1Context _context;

        public MonthlyPackagePaymentRepo(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<MonthlyPackagePayment> CreatePaymentAsync(MonthlyPackagePayment payment)
        {
            await _context.MonthlyPackagePayments.AddAsync(payment);
            await _context.SaveChangesAsync();

            return payment;
        }

        public async Task<MonthlyPackagePayment> CreateRefundAsync(int bookingPackageId, int userId, decimal amount)
        {
            var payment = new MonthlyPackagePayment
            {
                BookingPackageId = bookingPackageId,
                UserId = userId,
                Amount = amount,
                Status = "Refunded",
                Method = "Manual",
                PaidAt = DateTime.Now,
                CreatedAt = DateTime.Now
            };

            await _context.MonthlyPackagePayments.AddAsync(payment);
            await _context.SaveChangesAsync();

            return payment;
        }

    }
}
