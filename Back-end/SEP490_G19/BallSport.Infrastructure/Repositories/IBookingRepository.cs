using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories
{
    public interface IBookingRepository
    {
        Task AddAsync(Booking booking);
        Task SaveChangesAsync();
        Task<Booking> GetByIdAsync(int bookingId);
        Task<List<Booking>> GetAllAsync();
        Task UpdateAsync(Booking booking);
    }
}
