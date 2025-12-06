using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.API.Controllers.DistanceCalculator;
using BallSport.Application.DTOs;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services.DistanceCalculator
{
    public class FieldComplexNearbyService
    {
        private readonly FieldComplexRepository _repository;
        private readonly IDistanceCalculator _distanceCalculator;
        private readonly ILocationCacheService _cacheService;

        public FieldComplexNearbyService(
            FieldComplexRepository repository,
            IDistanceCalculator distanceCalculator,
            ILocationCacheService cacheService)
        {
            _repository = repository;
            _distanceCalculator = distanceCalculator;
            _cacheService = cacheService;
        }

        public async Task<List<FieldComplexDistanceResponseDTO>> GetNearbyAsync(double lat, double lng)
        {
            string cacheKey = $"nearby_{Math.Round(lat, 3)}_{Math.Round(lng, 3)}";

            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                var complexes = await _repository.GetAllActiveWithLocationAsync();

                return complexes
                    .Select(x => new FieldComplexDistanceResponseDTO
                    {
                        ComplexId = x.ComplexId,
                        OwnerId = x.OwnerId,
                        Name = x.Name,
                        Address = x.Address,
                        Description = x.Description,
                        Status = x.Status,
                        CreatedAt = x.CreatedAt,
                        ImageUrl = x.ImageUrl,
                        Latitude = x.Latitude,
                        Longitude = x.Longitude,
                        DistanceKm = _distanceCalculator.Calculate(
                            lat, lng,
                            x.Latitude!.Value,
                            x.Longitude!.Value)
                    })
                    .OrderBy(x => x.DistanceKm)
                    .ToList();
            });
        }
    }

}
