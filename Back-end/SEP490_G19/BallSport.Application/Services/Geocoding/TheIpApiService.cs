using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace BallSport.Application.Services.Geocoding
{
    public class TheIpApiService : ITheIpApiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public TheIpApiService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        public async Task<(double? lat, double? lng)> GetLocationFromIpAsync(string ip)
        {
            try
            {
                var apiKey = _config["TheIpApi:ApiKey"];
                var url = $"https://api.theipapi.com/v1/ip/{ip}?api_key={apiKey}";

                var response = await _httpClient.GetFromJsonAsync<TheIpApiResponse>(url);

                var lat = response?.body?.location?.latitude;
                var lng = response?.body?.location?.longitude;

                return (lat, lng);
            }
            catch
            {
                return (null, null);
            }
        }


    }

    // ✅ MAP ĐÚNG 100% JSON BẠN GỬI
    public class TheIpApiResponse
    {
        public string status { get; set; }
        public TheIpApiBody body { get; set; }
    }

    public class TheIpApiBody
    {
        public TheIpApiLocation location { get; set; }
    }

    public class TheIpApiLocation
    {
        public double? latitude { get; set; }
        public double? longitude { get; set; }
    }

}
