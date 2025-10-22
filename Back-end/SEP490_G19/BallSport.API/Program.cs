using BallSport.Application.Services;
using BallSport.Infrastructure.Repositories;
using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using BallSport.Infrastructure.Models;
using Banking.Application.Services;
using Microsoft.OpenApi.Models;

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
    options.AddPolicy("AllowSwagger", policy =>
    {
        policy.WithOrigins("http://localhost:5049", "https://localhost:7062")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ===================== DB CONTEXT =====================
services.AddDbContext<Sep490G19v1Context>(options =>
    options.UseSqlServer(config.GetConnectionString("MyCnn")));

// ===================== DEPENDENCY INJECTION =====================
services.AddScoped<UserRepositories>();
services.AddScoped<UserService>();
services.AddScoped<JwtService>();
services.AddScoped<OTPService>();
services.AddMemoryCache();

// Các service khác (Field, Deposit, Schedule…)
services.AddScoped<FieldTypesRepository>();
services.AddScoped<FieldTypeService>();

services.AddScoped<FieldComplexRepository>();
services.AddScoped<FieldComplexService>();

services.AddScoped<FieldRepository>();
services.AddScoped<FieldService>();

services.AddScoped<DepositPolicyRepository>();
services.AddScoped<DepositPolicyService>();

services.AddScoped<FieldScheduleRepository>();
services.AddScoped<FieldScheduleService>();

services.AddScoped<FieldPriceRepository>();
services.AddScoped<FieldPriceService>();

services.AddScoped<TimeSlotRepository>();
services.AddScoped<TimeSlotService>();

// ===================== SMTP =====================
var smtpSettings = config.GetSection("SmtpSettings").Get<SmtpSettings>();
services.AddSingleton(smtpSettings);
services.AddTransient<EmailService>();

// ===================== JWT AUTH =====================
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

// ===================== GOOGLE AUTH (chỉ bật khi thật sự dùng) =====================
var googleSection = builder.Configuration.GetSection("Authentication:Google");
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

// app.UseHttpsRedirection(); // nếu test local bằng http thì cứ tạm tắt

app.UseCors("AllowSwagger");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Check API is running
app.MapGet("/", () => "✅ API is running on Render!");

app.Run();
