using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;

public class PayOsService
{
    private readonly HttpClient _httpClient;
    private readonly string _checksumKey;

    public PayOsService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _checksumKey = config["PayOS:ChecksumKey"];
    }

    // Tạo QR code thanh toán
    public async Task<(string Code, DateTime ExpiresAt)> CreatePaymentQRCodeAsync(int bookingId, decimal amount, int fieldId)
    {
        var request = new
        {
            bookingId,
            amount,
            description = $"Thanh toán booking {bookingId}"
        };

        var response = await _httpClient.PostAsJsonAsync("/v1/payment/qrcode", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<PayOsQRCodeResponse>();
        if (result == null || string.IsNullOrEmpty(result.QRCodeUrl))
            throw new Exception("Không nhận được QR code từ PayOS");

        return (result.QRCodeUrl, result.ExpiresAt);
    }

    // Xác thực callback PayOS bằng checksum
    public bool VerifyChecksum(string orderCode, string status, string receivedChecksum)
    {
        var payload = $"{orderCode}|{status}|{_checksumKey}";
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var hashString = BitConverter.ToString(hash).Replace("-", "").ToLower();
        return hashString == receivedChecksum.ToLower();
    }
}

// DTO mapping response PayOS
public class PayOsQRCodeResponse
{
    public string QRCodeUrl { get; set; }
    public DateTime ExpiresAt { get; set; }
}
