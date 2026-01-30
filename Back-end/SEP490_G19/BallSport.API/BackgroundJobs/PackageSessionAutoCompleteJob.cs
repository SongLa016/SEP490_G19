using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using BallSport.Application.Services;

namespace BallSport.API.BackgroundJobs
{
    public class PackageSessionAutoCompleteJob : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;


        public PackageSessionAutoCompleteJob(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine("🔥 PackageSessionAutoCompleteJob STARTED");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    Console.WriteLine($"⏱ Job tick at {DateTime.Now}");

                    using var scope = _scopeFactory.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<MonthlyBookingService>();

                    var count = await service.AutoCompleteExpiredSessionsAsync();

                    Console.WriteLine($"✅ Auto completed {count} sessions");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Job error: {ex}");
                }

                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

    }
}
