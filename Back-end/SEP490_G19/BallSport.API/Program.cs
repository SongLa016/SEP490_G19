using System.Text;
using System.Text.Json.Serialization;
using BallSport.Application.CloudinarySettings;
using BallSport.Application.Services;
using BallSport.Application.Services.AdminStatistics;
using BallSport.Application.Services.Community;
using BallSport.Application.Services.MatchFinding;
using BallSport.Application.Services.OwnerStatistics;
using BallSport.Application.Services.RatingBooking;
using BallSport.Application.Services.StatisticOwner;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using BallSport.Infrastructure.Repositories.AdminStatistics;
using BallSport.Infrastructure.Repositories.Community;
using BallSport.Infrastructure.Repositories.MatchFinding;
using BallSport.Infrastructure.Repositories.OwnerStatistics;
using BallSport.Infrastructure.Repositories.PlayerStatistics;
using BallSport.Infrastructure.Repositories.RatingBooking;
using BallSport.Infrastructure.Repositories.StatisticOwner;
using BallSport.Infrastructure.Settings;
using Banking.Application.Services;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
    }

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration((hostingContext, config) =>
            {
                // Xóa tất cả config mặc định
                config.Sources.Clear();

                // Load JSON + environment variables, không tạo watcher
                config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
                      .AddJsonFile(
                          $"appsettings.{hostingContext.HostingEnvironment.EnvironmentName}.json",
                          optional: true, reloadOnChange: false)
                      .AddEnvironmentVariables();
            })
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.ConfigureServices((context, services) =>
                {
                    var config = context.Configuration;

                    // ===================== SETTINGS =====================
                    services.Configure<CloudinarySettings>(config.GetSection("CloudinarySettings"));

                    // ===================== CONTROLLERS + SWAGGER =====================
                    services.AddControllers()
                        .AddJsonOptions(options =>
                        {
                            options.JsonSerializerOptions.Converters.Add(new TimeOnlyJsonConverter());
                            options.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
                        });

                    services.AddEndpointsApiExplorer();
                    services.AddSwaggerGen(c =>
                    {
                        c.SwaggerDoc("v1", new() { Title = "BallSport API", Version = "v1" });

                        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                        {
                            Name = "Authorization",
                            Type = SecuritySchemeType.Http,
                            Scheme = "Bearer",
                            BearerFormat = "JWT",
                            In = ParameterLocation.Header,
                            Description = "Nhập token JWT dạng: Bearer {token}"
                        });

                        c.AddSecurityRequirement(new OpenApiSecurityRequirement
                        {
                            {
                                new OpenApiSecurityScheme
                                {
                                    Reference = new OpenApiReference
                                    {
                                        Type = ReferenceType.SecurityScheme,
                                        Id = "Bearer"
                                    }
                                },
                                Array.Empty<string>()
                            }
                        });
                    });

                    // ===================== CORS =====================
                    services.AddCors(options =>
                    {
                        options.AddPolicy("AllowAll", builder =>
                        {
                            builder
                                .WithOrigins(
                                    "http://localhost:3000",
                                    "https://localhost:3000",
                                    "https://sep490-g19-zxph.onrender.com"
                                )
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                        });
                    });

                    // ===================== DATABASE =====================
                    services.AddDbContext<Sep490G19v1Context>(options =>
                        options.UseSqlServer(config.GetConnectionString("MyCnn")));

                    // ===================== DEPENDENCY INJECTION =====================
                    services.AddMemoryCache();

                    // --- Copy toàn bộ DI services của bạn vào đây ---
                    services.AddMemoryCache();

                    // --- Statistic Owner ---
                    services.AddScoped<IOwnerRecentBookingRepository, OwnerRecentBookingRepository>();
                    services.AddScoped<OwnerRecentBookingService>();
                    services.AddScoped<IFieldPerformanceRepository, FieldPerformanceRepository>();
                    services.AddScoped<OwnerFieldPerformanceService>();
                    services.AddScoped<IDailyRevenueRepository, DailyRevenueRepository>();
                    services.AddScoped<OwnerDailyRevenueService>();
                    services.AddScoped<IOwnerSummaryRepository, OwnerSummaryRepository>();
                    services.AddScoped<OwnerSummaryService>();
                    services.AddScoped<IOwnerFillRateRepository, OwnerFillRateRepository>();
                    services.AddScoped<OwnerFillRateService>();
                    services.AddScoped<OwnerTimeSlotStatisticRepository>();
                    services.AddScoped<OwnerTimeSlotStatisticService>();

                    // --- Statistic Admin ---
                    services.AddScoped<IAdminUserStatisticRepository, AdminUserStatisticRepository>();
                    services.AddScoped<AdminUserStatisticService>();
                    services.AddScoped<IAdminOwnerStatisticRepository, AdminOwnerStatisticRepository>();
                    services.AddScoped<AdminOwnerStatisticService>();
                    services.AddScoped<IBookingStatisticRepository, BookingStatisticRepository>();
                    services.AddScoped<BookingStatisticService>();
                    services.AddScoped<IRevenueStatisticRepository, RevenueStatisticRepository>();
                    services.AddScoped<RevenueStatisticService>();
                    services.AddScoped<IFieldStatisticRepository, FieldStatisticRepository>();
                    services.AddScoped<FieldStatisticService>();
                    services.AddScoped<IReportStatisticRepository, ReportStatisticRepository>();
                    services.AddScoped<ReportStatisticService>();
                    services.AddScoped<IPostStatisticRepository, PostStatisticRepository>();
                    services.AddScoped<IPostStatisticService, PostStatisticService>();
                    services.AddScoped<IRecentActivityRepository, RecentActivityRepository>();
                    services.AddScoped<AdminRecentActivityService>();
                    services.AddScoped<IUserListRepository, UserListRepository>();
                    services.AddScoped<IUserListService, UserListService>();

                    //--- Statistic Player ---
                    services.AddScoped<PlayRepository>();
                    services.AddScoped<PlayerStatisticService>();
                    services.AddScoped<IPlayerRecentActivityRepository, PlayerRecentActivityRepository>();
                    services.AddScoped<PlayerRecentActivityService>();
                    //--- Rating Booking ---
                    services.AddScoped<RatingRepository>();
                    services.AddScoped<RatingService>();
                    services.AddScoped<RatingReplyRepository>();
                    services.AddScoped<RatingReplyService>();

                    // --- Core user / auth ---
                    services.AddScoped<UserRepositories>();
                    services.AddScoped<UserService>();
                    services.AddScoped<JwtService>();
                    services.AddScoped<OTPService>();
                    services.AddScoped<UserProfileService>();
                    services.AddScoped<UserProfileRepository>();
                    services.AddScoped<ICloudinaryService, CloudinaryService>();
                    services.AddScoped<ICloudinaryService, CloudinaryService>();
                    services.AddScoped<IUserRepository, LockUserRepository>();
                    services.AddScoped<IUserService, LockUserService>();

                    // --- Booking & Payment ---
                    services.AddScoped<BookingService>();
                    services.AddScoped<BookingFieldsRepoitory>();
                    services.AddScoped<BookingCancellationRepository>();
                    services.AddScoped<BookingCancellationReRepository>();
                    services.AddScoped<BookingCancellationReService>();
                    services.AddScoped<PaymentRepository>();

                    // === Phần mới từ nhánh Trung ===
                    services.AddScoped<BookingPackageRepository>();
                    services.AddScoped<MonthlyPackagePaymentRepo>();
                    services.AddScoped<PackageSessionRepository>();
                    services.AddScoped<BookingPackageSessionDraftRepository>();
                    services.AddScoped<MonthlyBookingService>();

                    // --- Bank accounts ---
                    services.AddScoped<PlayerBankAccountRepository>();
                    services.AddScoped<OwnerBankAccountRepository>();
                    services.AddScoped<OwnerBankAccountService>();
                    services.AddScoped<PlayerBankAccountService>();

                    // --- Field-related ---
                    services.AddScoped<FieldRepository>();
                    services.AddScoped<FieldService>();
                    services.AddScoped<IFieldTypeRepository, FieldTypeRepository>();
                    services.AddScoped<IFieldTypeService, FieldTypeService>();
                    services.AddScoped<FieldTypeService>();
                    services.AddScoped<FieldComplexRepository>();
                    services.AddScoped<FieldComplexService>();
                    services.AddScoped<DepositPolicyRepository>();
                    services.AddScoped<DepositPolicyService>();
                    services.AddScoped<FieldPriceRepository>();
                    services.AddScoped<FieldPriceService>();
                    services.AddScoped<ITimeSlotRepository, TimeSlotRepository>();
                    services.AddScoped<ITimeSlotService, TimeSlotService>();
                    services.AddScoped<IFieldPriceRepository, FieldPriceRepository>();
                    services.AddScoped<IFieldPriceService, FieldPriceService>();
                    services.AddScoped<IFieldScheduleRepository, FieldScheduleRepository>();
                    services.AddScoped<IFieldScheduleService, FieldScheduleService>();
                    services.AddScoped<TimeSlotService>();
                    services.AddScoped<ITopFieldRepository, TopFieldRepository>();
                    services.AddScoped<ITopFieldService, TopFieldService>();
                    services.AddScoped<IPlayerProfileRepository, PlayerProfileRepository>();
                    services.AddScoped<IPlayerProfileService, PlayerProfileService>();
                    services.AddScoped<IFavoriteFieldRepository, FavoriteFieldRepository>();
                    services.AddScoped<IFavoriteFieldService, FavoriteFieldService>();


                    // 1. Tăng giới hạn upload (100MB)
                    services.Configure<KestrelServerOptions>(options => options.Limits.MaxRequestBodySize = 100_000_000);
                    services.Configure<IISServerOptions>(options => options.MaxRequestBodySize = 100_000_000);

                    // --- Community module ---
                    services.AddScoped<IPostRepository, PostRepository>();
                    services.AddScoped<ICommentRepository, CommentRepository>();
                    services.AddScoped<IPostLikeRepository, PostLikeRepository>();
                    services.AddScoped<INotificationRepository, NotificationRepository>();
                    services.AddScoped<IReportRepository, ReportRepository>();
                    services.AddScoped<ITimeSlotService, TimeSlotService>();
                    services.AddScoped<IPostService, PostService>();
                    services.AddScoped<ICommentService, CommentService>();
                    services.AddScoped<INotificationService, NotificationService>();
                    services.AddScoped<IReportService, ReportService>();

                    // --- Match Finding module ---
                    services.AddScoped<IMatchFindingRepository, MatchFindingRepository>();
                    services.AddScoped<IMatchFindingService, MatchFindingService>();

                    // --- Settings ---
                    services.Configure<CommunitySettings>(config.GetSection("CommunitySettings"));
                    services.Configure<NotificationSettings>(config.GetSection("NotificationSettings"));
                    services.Configure<ReportSettings>(config.GetSection("ReportSettings"));

                    // ===================== SMTP (Email) =====================
                    var smtpSettings = config.GetSection("SmtpSettings").Get<SmtpSettings>();
                    services.AddSingleton(smtpSettings);
                    services.AddTransient<EmailService>();
                    services.AddSingleton(sp =>
                    {
                        var settings = sp.GetRequiredService<IOptions<CloudinarySettings>>().Value;
                        return new Cloudinary(new Account(settings.CloudName, settings.ApiKey, settings.ApiSecret));
                    });

                    // ===================== AUTHENTICATION =====================
                    var googleSection = config.GetSection("Authentication:Google");
                    services.AddAuthentication(options =>
                    {
                        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                        options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    })
                    .AddJwtBearer(options =>
                    {
                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            ValidateIssuer = true,
                            ValidateAudience = true,
                            ValidateLifetime = true,
                            ValidateIssuerSigningKey = true,
                            ValidIssuer = config["JwtSettings:Issuer"],
                            ValidAudience = config["JwtSettings:Audience"],
                            IssuerSigningKey = new SymmetricSecurityKey(
                                Encoding.UTF8.GetBytes(config["JwtSettings:SecretKey"])),
                            RoleClaimType = "Role"
                        };
                    })
                    .AddCookie(options =>
                    {
                        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                        options.Cookie.SameSite = SameSiteMode.Lax;
                    })
                    .AddGoogle(options =>
                    {
                        options.ClientId = googleSection["ClientId"];
                        options.ClientSecret = googleSection["ClientSecret"];
                        options.CallbackPath = "/signin-google";
                    });

                    // ===================== KESTREL UPLOAD LIMIT =====================
                    services.Configure<KestrelServerOptions>(options => options.Limits.MaxRequestBodySize = 100_000_000);
                });

                webBuilder.Configure((context, app) =>
                {
                    var env = context.HostingEnvironment;

                    app.UseRouting();
                    app.UseCors("AllowAll");

                    app.UseAuthentication();
                    app.UseAuthorization();

                    app.UseSwagger();
                    app.UseSwaggerUI(c =>
                    {
                        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BallSport API v1");
                        c.RoutePrefix = "swagger";
                    });

                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapControllers();
                        endpoints.MapGet("/", async context =>
                        {
                            await context.Response.WriteAsync("✅ BallSport API is running with JWT + CORS + Swagger + Community!");
                        });
                    });


                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapControllers();
                        endpoints.MapGet("/", context =>
                        {
                            return context.Response.WriteAsync("✅ BallSport API is running with JWT + CORS + Swagger + Community!");
                        });
                    });

                });

                // Khai báo URL cho Render / Docker
                webBuilder.UseUrls("http://+:8080");
            });
}
