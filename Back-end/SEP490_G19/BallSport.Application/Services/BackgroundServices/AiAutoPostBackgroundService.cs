using BallSport.Application.Services.AISeoContent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

public class AiAutoPostBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AiAutoPostBackgroundService> _logger;

    public AiAutoPostBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<AiAutoPostBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("✅ AI AUTO POST BACKGROUND SERVICE STARTED");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.Now;

                // ✅ Tính thời gian tới 5h sáng tiếp theo
                var nextRun = now.Date.AddHours(5);
                if (now > nextRun)
                    nextRun = nextRun.AddDays(1);

                var delay = nextRun - now;

                _logger.LogInformation($"⏰ Chờ tới {nextRun:HH:mm dd/MM/yyyy} để chạy AI SEO");

                await Task.Delay(delay, stoppingToken);

                using (var scope = _scopeFactory.CreateScope())
                {
                    var autoPostService = scope.ServiceProvider
                        .GetRequiredService<AiAutoPostService>();

                    _logger.LogInformation("🚀 BẮT ĐẦU AUTO SEO...");
                    await autoPostService.RunDailyAsync();
                    _logger.LogInformation("✅ AUTO SEO HOÀN TẤT");
                }
            }
            catch (TaskCanceledException)
            {
                // App shutdown
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ LỖI AUTO SEO BACKGROUND");
            }
        }
    }
}
