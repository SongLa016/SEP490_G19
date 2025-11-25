using BallSport.Application.DTOs.StatisticOwner;
using BallSport.Infrastructure.Repositories.StatisticOwner;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace BallSport.Application.Services.StatisticOwner
{
    public class OwnerRecentBookingService
    {
        private readonly IOwnerRecentBookingRepository _recentBookingRepository;

        public OwnerRecentBookingService(IOwnerRecentBookingRepository recentBookingRepository)
        {
            _recentBookingRepository = recentBookingRepository;
        }

        public async Task<List<RecentBooking>> GetRecentBookingsAsync(int ownerId, int top = 10)
        {
            return await _recentBookingRepository.GetRecentBookingsAsync(ownerId, top);
        }
    }
}
