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

var builder = WebApplication.CreateBuilder(args);

// Lấy service collection và configuration
var services = builder.Services;
var config = builder.Configuration;

// Add services to the container.
services.AddControllers();
services.AddEndpointsApiExplorer();
services.AddSwaggerGen();
services.AddMemoryCache();

// Đăng ký Repository và Service từ Trung
services.AddScoped<UserRepositories>();
services.AddScoped<UserService>();
services.AddScoped<JwtService>();
services.AddScoped<OTPService>();

// Đăng ký Repository và Service từ main
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

// Đăng ký DbContext (chỉ giữ 1 lần)
services.AddDbContext<Sep490G19v1Context>(options =>
    options.UseSqlServer(config.GetConnectionString("MyCnn")));

// Cấu hình Authentication với JWT
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

// Cấu hình Google Authentication
services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
})
.AddCookie()
.AddGoogle(options =>
{
    var googleAuthNSection = config.GetSection("GoogleKey");
    options.ClientId = googleAuthNSection["ClientId"];
    options.ClientSecret = googleAuthNSection["ClientSecret"];
    options.CallbackPath = "/signin-google";
});


// SMTP + Email Service
var smtpSettings = config.GetSection("SmtpSettings").Get<SmtpSettings>();
services.AddSingleton(smtpSettings);
services.AddTransient<EmailService>();

var app = builder.Build();

//deployment port
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Add($"http://*:{port}");
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

// Thêm Authentication trước Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
//check api is running
app.MapGet("/", () => "✅ API is running on Render!");

app.Run();
