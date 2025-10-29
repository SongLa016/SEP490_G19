
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly Sep490G19v1Context _context;

        public PaymentRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task AddAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
        }

        public async Task<Payment?> GetByOrderCodeAsync(string orderCode)
        {
            return await _context.Payments.FirstOrDefaultAsync(p => p.OrderCode == orderCode);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
        public async Task UpdateAsync(Payment payment)
        {
            _context.Payments.Update(payment);
            await _context.SaveChangesAsync();
        }
    }
}
