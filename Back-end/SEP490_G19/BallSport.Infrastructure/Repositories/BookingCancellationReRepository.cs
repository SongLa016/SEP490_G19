using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories
{
    public class BookingCancellationReRepository
    {
        private readonly Sep490G19v1Context _context;

        public BookingCancellationReRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<List<BookingCancellationRequest>> GetAllAsync()
        {
            return await _context.BookingCancellationRequests
                .Include(r => r.Booking)
                .ToListAsync();
        }

        public async Task<BookingCancellationRequest?> GetByIdAsync(int id)
        {
            return await _context.BookingCancellationRequests
                .Include(r => r.Booking)
                .FirstOrDefaultAsync(r => r.RequestId == id);
        }

        public async Task<BookingCancellationRequest> CreateAsync(BookingCancellationRequest request)
        {
            _context.BookingCancellationRequests.Add(request);
            await _context.SaveChangesAsync();
            return request;
        }


        public async Task<BookingCancellationRequest> UpdateAsync(BookingCancellationRequest request)
        {
            _context.BookingCancellationRequests.Update(request);
            await _context.SaveChangesAsync();
            return request;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var request = await _context.BookingCancellationRequests.FindAsync(id);
            if (request == null) return false;

           
            if (request.RequestStatus != "Pending")
                throw new InvalidOperationException("Không thể xóa yêu cầu đã được duyệt hoặc từ chối.");

            _context.BookingCancellationRequests.Remove(request);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}
