using System.Collections.Generic;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

public class BookingRepository : IBookingRepository
{
    private readonly Sep490G19v1Context _context;

    public BookingRepository(Sep490G19v1Context context)
    {
        _context = context;
    }

    public async Task AddAsync(Booking booking)
    {
        await _context.Bookings.AddAsync(booking);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<Booking> GetByIdAsync(int bookingId)
    {
        return await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
    }

    public async Task<List<Booking>> GetAllAsync()
    {
        return await _context.Bookings.ToListAsync();
    }

    public Task UpdateAsync(Booking booking)
    {
        throw new NotImplementedException();
    }
}
