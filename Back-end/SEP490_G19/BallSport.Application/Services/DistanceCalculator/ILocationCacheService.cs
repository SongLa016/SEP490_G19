using BallSport.Application.DTOs;

namespace BallSport.API.Controllers.DistanceCalculator
{
    public interface ILocationCacheService
    {
        Task<List<FieldComplexDistanceResponseDTO>> GetOrSetAsync(
            string key,
            Func<Task<List<FieldComplexDistanceResponseDTO>>> factory
        );
        void ClearNearbyCache();
    }

}
