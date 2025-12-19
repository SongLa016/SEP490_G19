using System;
using System.Threading.Tasks;
using BallSport.Infrastructure.Repositories.AdminStatistics;

namespace BallSport.Application.Services.AdminStatistics
{
    public interface IPostStatisticService
    {
        Task<object> GetPostStatisticsAsync();
    }

    public class PostStatisticService : IPostStatisticService
    {
        private readonly IPostStatisticRepository _repo;

        public PostStatisticService(IPostStatisticRepository repo)
        {
            _repo = repo;
        }

        public async Task<object> GetPostStatisticsAsync()
        {
            var totalThisMonth = await _repo.GetPostsOfThisMonthAsync();
            var totalLastMonth = await _repo.GetPostsOfLastMonthAsync();
            var totalAllTime = await _repo.GetTotalPostsAsync();

            double percentChange = 0;

            if (totalLastMonth > 0)
            {
                percentChange = ((double)(totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
            }
            else if (totalThisMonth > 0)
            {
                percentChange = 100; 
            }

            return new
            {
                totalPosts = totalAllTime,
                totalPostsThisMonth = totalThisMonth,
                percentChange = Math.Round(percentChange, 2)
            };
        }
    }
}
