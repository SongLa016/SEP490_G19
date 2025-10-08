using BallSport.Application.Services;
using BallSport.Infrastructure.Repositories;
using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Lấy service collection và configuration
var services = builder.Services;
var config = builder.Configuration;

// Add services to the container.
services.AddControllers();
services.AddEndpointsApiExplorer();
services.AddSwaggerGen();

// Đăng ký Repository và Service
services.AddScoped<UserRepositories>();
services.AddScoped<UserService>();
services.AddScoped<JwtService>();

// Đăng ký DbContext
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Thêm Authentication trước Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
