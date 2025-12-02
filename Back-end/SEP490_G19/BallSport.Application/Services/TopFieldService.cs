using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Repositories;
using static BallSport.Infrastructure.Repositories.TopFieldRepository;

namespace BallSport.Application.Services
{
    public interface ITopFieldService
    {
        Task<List<TopFieldDto>> GetTopFieldBookingsAsync();
    }
    public class TopFieldService : ITopFieldService
    {
        private readonly ITopFieldRepository _topFieldRepository;


        public TopFieldService(ITopFieldRepository topFieldRepository)
        {
            _topFieldRepository = topFieldRepository;
        }


        public Task<List<TopFieldDto>> GetTopFieldBookingsAsync()
        {
            return _topFieldRepository.GetTopFieldBookingsAsync();
        }
    }
}
