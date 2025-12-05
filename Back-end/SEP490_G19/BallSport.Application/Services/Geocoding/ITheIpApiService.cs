using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.Services.Geocoding
{
    public interface ITheIpApiService
    {
        Task<(double? lat, double? lng)> GetLocationFromIpAsync(string ip);
    }
}
