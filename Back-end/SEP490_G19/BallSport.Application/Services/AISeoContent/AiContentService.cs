using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BallSport.Application.DTOs.AISeoContent;
using Microsoft.Extensions.Configuration;

public class AiContentService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;

    public AiContentService(IConfiguration config)
    {
        _config = config;
        _httpClient = new HttpClient();
    }

    public async Task<string> GenerateReviewContentAsync(AiComplexDataDto data)
    {
        var apiKey = _config["OpenAI:ApiKey"];
        var model = _config["OpenAI:Model"];

        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        var prompt = BuildSeoPrompt(data);

        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = "Bạn là chuyên gia SEO sân bóng tại Việt Nam." },
                new { role = "user", content = prompt }
            },
            temperature = 0.7
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(
            "https://api.openai.com/v1/chat/completions",
            content
        );

        var responseJson = await response.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(responseJson);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString()!;
    }

    private string BuildSeoPrompt(AiComplexDataDto data)
    {
        var fieldText = string.Join("\n", data.Fields.Select(f =>
            $"- {f.Name} | {f.Size} | {f.GrassType} | Giá: {f.PricePerHour:n0}đ/giờ"));

        var commentText = string.Join("\n", data.TopComments);

        return $"""
Hãy viết 1 bài review sân bóng chuẩn SEO Google, dài 50 từ, giọng văn tự nhiên như người thật trải nghiệm.

Tên khu sân: {data.Name}
Địa chỉ: {data.Address}, {data.Ward}, {data.District}, {data.Province}
Mô tả: {data.Description}
Đánh giá trung bình: {data.AvgStars}/5
Nhận xét nổi bật:
{commentText}
Yêu cầu:
- Có tiêu đề hấp dẫn
- Có H2, H3 rõ ràng
- Có mục ưu điểm / nhược điểm
- Có FAQ cuối bài
- Không được nói đây là bài do AI viết
- Tối ưu từ khóa: sân bóng {data.District}, sân bóng giá rẻ {data.Province}
""";
    }
}
