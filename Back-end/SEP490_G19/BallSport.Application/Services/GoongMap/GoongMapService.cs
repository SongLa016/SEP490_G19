using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
namespace BallSport.Application.Services.GoongMap
{
    public class GoongMapService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GoongMapService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["GoongMap:ApiKey"]!;
        }

        public async Task<(double lat, double lng, string formattedAddress)?> GetLocationDetailAsync(string address)
        {
            var url = $"https://rsapi.goong.io/Geocode?address={Uri.EscapeDataString(address)}&api_key={_apiKey}";

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var results = doc.RootElement.GetProperty("results");
            if (results.GetArrayLength() == 0) return null;

            var first = results[0];

            var location = first
                .GetProperty("geometry")
                .GetProperty("location");

            var formattedAddress = first.GetProperty("formatted_address").GetString();

            return (
                location.GetProperty("lat").GetDouble(),
                location.GetProperty("lng").GetDouble(),
                formattedAddress!
            );
        }

    }

}
