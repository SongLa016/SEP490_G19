
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using static BallSport.Infrastructure.Repositories.TopFieldRepository;


namespace BallSport.Infrastructure.Repositories
{
    public interface ITopFieldRepository
    {
        Task<List<TopFieldDto>> GetTopFieldBookingsAsync();
    }
    public class TopFieldRepository : ITopFieldRepository
    {
        private readonly Sep490G19v1Context _context;


        public TopFieldRepository(Sep490G19v1Context context)
        {
            _context = context;
        }


        public async Task<List<TopFieldDto>> GetTopFieldBookingsAsync()
        {
            var query = _context.Bookings
            .Include(b => b.Schedule)
            .ThenInclude(s => s.Field)
            .Where(b => b.BookingStatus == "Completed" && b.PaymentStatus == "Paid")
            .GroupBy(b => b.Schedule.Field)
            .Select(g => new TopFieldDto
            {
                FieldId = g.Key.FieldId,
                FieldName = g.Key.Name,
                ImageUrl = g.Key.ImageUrl,
                TotalBookings = g.Count()
            })
            .OrderByDescending(x => x.TotalBookings);


            return await query.ToListAsync();
        }
        public class TopFieldDto
        {
            public int FieldId { get; set; }
            public string FieldName { get; set; }
            public string? ImageUrl { get; set; }
            public int TotalBookings { get; set; }
        }
    }
}