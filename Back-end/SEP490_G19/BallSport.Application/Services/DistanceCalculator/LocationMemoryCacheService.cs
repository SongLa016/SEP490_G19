using BallSport.Application.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace BallSport.API.Controllers.DistanceCalculator
{
    public class LocationMemoryCacheService : ILocationCacheService
    {
        private readonly IMemoryCache _cache;

        public LocationMemoryCacheService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public async Task<List<FieldComplexDistanceResponseDTO>> GetOrSetAsync(
            string key,
            Func<Task<List<FieldComplexDistanceResponseDTO>>> factory)
        {
            if (!_cache.TryGetValue(key, out List<FieldComplexDistanceResponseDTO> data))
            {
                data = await factory();

                _cache.Set(key, data, TimeSpan.FromSeconds(60));
            }

            return data;
        }
        public void ClearNearbyCache()
        {
            if (_cache is MemoryCache memoryCache)
            {
                memoryCache.Compact(1.0); // XÓA 100% CACHE
            }
        }
    }

}
