using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.Services.Geocoding
{
    public interface IGeocodingService
    {
        Task<(double? lat, double? lng)> GetLocationFromAddressAsync(string address);
    }

}
