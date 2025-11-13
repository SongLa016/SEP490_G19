using BallSport.Application.Services;
using BallSport.Application.Services.Community;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using BallSport.Infrastructure.Repositories.Community;
using BallSport.Infrastructure.Settings;
using Banking.Application.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var services = builder.Services;
var config = builder.Configuration;

// ===================== CONTROLLERS + SWAGGER =====================
services.AddControllers();
services.AddEndpointsApiExplorer();

services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "BallSport API", Version = "v1" });

    // Thêm JWT Bearer vào Swagger
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

// --- Core user / auth ---
services.AddScoped<UserRepositories>();
services.AddScoped<UserService>();
services.AddScoped<JwtService>();
services.AddScoped<OTPService>();

// --- Booking & Payment ---
services.AddScoped<BookingService>();
services.AddScoped<BookingFieldsRepoitory>();
services.AddScoped<BookingCancellationRepository>();
services.AddScoped<BookingCancellationReRepository>();
services.AddScoped<BookingCancellationReService>();
services.AddScoped<PaymentRepository>();

// --- Bank accounts ---
services.AddScoped<PlayerBankAccountRepository>();
services.AddScoped<OwnerBankAccountRepository>();
services.AddScoped<OwnerBankAccountService>();
services.AddScoped<PlayerBankAccountService>();

// --- Field-related ---
services.AddScoped<FieldRepository>();
services.AddScoped<FieldService>();
services.AddScoped<FieldTypesRepository>();
services.AddScoped<FieldTypeService>();
services.AddScoped<FieldComplexRepository>();
services.AddScoped<FieldComplexService>();
services.AddScoped<DepositPolicyRepository>();
services.AddScoped<DepositPolicyService>();
services.AddScoped<FieldScheduleRepository>();
services.AddScoped<FieldScheduleService>();
services.AddScoped<FieldPriceRepository>();
services.AddScoped<FieldPriceService>();
services.AddScoped<TimeSlotRepository>();
services.AddScoped<TimeSlotService>();

// --- Community module ---
services.AddScoped<IPostRepository, PostRepository>();
services.AddScoped<ICommentRepository, CommentRepository>();
services.AddScoped<IPostLikeRepository, PostLikeRepository>();
services.AddScoped<INotificationRepository, NotificationRepository>();
services.AddScoped<IReportRepository, ReportRepository>();

services.AddScoped<IPostService, PostService>();
services.AddScoped<ICommentService, CommentService>();
services.AddScoped<INotificationService, NotificationService>();
services.AddScoped<IReportService, ReportService>();

// --- Settings ---
builder.Services.Configure<CommunitySettings>(config.GetSection("CommunitySettings"));
builder.Services.Configure<NotificationSettings>(config.GetSection("NotificationSettings"));
builder.Services.Configure<ReportSettings>(config.GetSection("ReportSettings"));

// ===================== SMTP (Email) =====================
var smtpSettings = config.GetSection("SmtpSettings").Get<SmtpSettings>();
services.AddSingleton(smtpSettings);
services.AddTransient<EmailService>();

// ===================== AUTHENTICATION =====================

// --- JWT ---
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
                Encoding.UTF8.GetBytes(config["JwtSettings:SecretKey"]))
        };
    });

// --- Google Auth ---
var googleSection = config.GetSection("Authentication:Google");
var googleClientId = googleSection["ClientId"];
var googleClientSecret = googleSection["ClientSecret"];

if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
    })
    .AddCookie()
    .AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.CallbackPath = "/signin-google";
    });
}

// ===================== BUILD APP =====================
var app = builder.Build();

// ===================== DEPLOYMENT PORT =====================
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Add($"http://*:{port}");

// ===================== MIDDLEWARE PIPELINE =====================
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "BallSport API v1");
    c.RoutePrefix = "swagger";
});

// Nếu test local bằng HTTP → có thể tắt HTTPS redirect
// app.UseHttpsRedirection();
app.UseRouting();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Check API is running
app.MapGet("/", () => "✅ BallSport API is running with JWT + CORS + Swagger + Community!");

app.Run();
