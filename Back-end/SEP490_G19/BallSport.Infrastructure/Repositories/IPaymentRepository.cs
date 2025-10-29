using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories
{
    public interface IPaymentRepository
    {
        Task AddAsync(Payment payment);
        Task SaveChangesAsync();
        Task<Payment?> GetByOrderCodeAsync(string orderCode);
        Task UpdateAsync(Payment payment);
    }
}
