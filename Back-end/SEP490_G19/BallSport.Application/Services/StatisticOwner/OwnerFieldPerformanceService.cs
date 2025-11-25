using BallSport.Application.DTOs.StatisticOwner;
using BallSport.Infrastructure.Repositories.StatisticOwner;
using System.Collections.Generic;
using System.Threading.Tasks;
using static BallSport.Infrastructure.Repositories.StatisticOwner.FieldPerformanceRepository;

namespace BallSport.Application.Services.StatisticOwner
{
    public class OwnerFieldPerformanceService
    {
        private readonly IFieldPerformanceRepository _repository;

        public OwnerFieldPerformanceService(IFieldPerformanceRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<FieldPerformance>> GetFieldPerformanceAsync(int ownerId)
        {
            return await _repository.GetFieldPerformanceAsync(ownerId);
        }
    }
}
