using BallSport.Infrastructure.Repositories.Community;
using Microsoft.Extensions.DependencyInjection;

namespace BallSport.Infrastructure.Extensions
{
    public static class RepositoryServiceExtensions
    {
        public static IServiceCollection AddCommunityRepositories(this IServiceCollection services)
        {
            // Đăng ký các Repository cho module Community
            services.AddScoped<IPostRepository, PostRepository>();
            services.AddScoped<ICommentRepository, CommentRepository>();
            services.AddScoped<IPostLikeRepository, PostLikeRepository>();
            services.AddScoped<INotificationRepository, NotificationRepository>();
            services.AddScoped<IReportRepository, ReportRepository>();

            return services;
        }

        // Nếu muốn đăng ký tất cả repositories
        public static IServiceCollection AddAllRepositories(this IServiceCollection services)
        {
            // Community Repositories
            services.AddCommunityRepositories();

            // Có thể thêm các repository khác ở đây
            // services.AddScoped<IFieldRepository, FieldRepository>();
            // services.AddScoped<IBookingRepository, BookingRepository>();
            // ...

            return services;
        }
    }
}