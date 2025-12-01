
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories.StatisticOwner
{
    public interface IOwnerFillRateRepository
    {
        Task<double> GetFillRateAsync(int ownerId);
    }

    public class OwnerFillRateRepository : IOwnerFillRateRepository
    {
        private readonly Sep490G19v1Context _context;

        public OwnerFillRateRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<double> GetFillRateAsync(int ownerId)
        {
            // Tổng số slot có trong 1 ngày (tức tổng TimeSlot của các sân)
            int totalSlotsInDay = await _context.TimeSlots
                .CountAsync(ts => ts.Field.Complex.OwnerId == ownerId);

            if (totalSlotsInDay == 0)
                return 0;

            // Tổng số slot đã được đặt (FieldSchedule có booking)
            int bookedSlots = await _context.FieldSchedules
                .Where(fs => fs.Field!.Complex.OwnerId == ownerId)
                .CountAsync(fs => fs.Bookings.Any());

            return (double)bookedSlots / totalSlotsInDay * 100;
        }
    }
}
