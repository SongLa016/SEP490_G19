using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.Services.Geocoding
{
    public class NominatimGeocodingService : IGeocodingService
    {
        private readonly HttpClient _httpClient;

        public NominatimGeocodingService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("BallSportApp/1.0");
        }

        public async Task<(double? lat, double? lng)> GetLocationFromAddressAsync(string address)
        {
            try
            {
                var url = $"https://nominatim.openstreetmap.org/search" +
                          $"?q={Uri.EscapeDataString(address)}&format=json&limit=1";

                var response = await _httpClient
                    .GetFromJsonAsync<List<NominatimResponse>>(url);

                var first = response?.FirstOrDefault();

                if (first == null)
                    return (null, null);

                return (
                    double.Parse(first.lat),
                    double.Parse(first.lon)
                );
            }
            catch
            {
                return (null, null);
            }
        }
    }

    public class NominatimResponse
    {
        public string lat { get; set; }
        public string lon { get; set; }
    }
}
