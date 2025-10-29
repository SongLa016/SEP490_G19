using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using BallSport.Application.Services;
using BallSport.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<Sep490G19v1Context>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("MyCnn")));

<<<<<<< Updated upstream
builder.Services.AddScoped<FieldTypesRepository>();
builder.Services.AddScoped<FieldTypeService>();
builder.Services.AddScoped<FieldComplexRepository>();
builder.Services.AddScoped<FieldComplexService>();
builder.Services.AddScoped<FieldRepository>();
builder.Services.AddScoped<FieldService>();
builder.Services.AddScoped<DepositPolicyRepository>();
builder.Services.AddScoped<DepositPolicyService>();
builder.Services.AddScoped<FieldScheduleRepository>();
builder.Services.AddScoped<FieldScheduleService>();
builder.Services.AddScoped<FieldPriceRepository>();
builder.Services.AddScoped<FieldPriceService>();
builder.Services.AddScoped<TimeSlotRepository>();
builder.Services.AddScoped<TimeSlotService>();
=======
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

// ===================== CORS (Quan trọng) =====================
services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",            // React local
            "http://localhost:5049",            // Swagger HTTP
            "https://localhost:7062",           // Swagger HTTPS
            "https://sep490-g19.onrender.com",  // Frontend deploy Render
            "https://ballsport-frontend.onrender.com" // ví dụ nếu deploy React riêng
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// ===================== DB CONTEXT =====================
services.AddDbContext<Sep490G19v1Context>(options =>
    options.UseSqlServer(
        config.GetConnectionString("MyCnn"),
        sqlOptions => sqlOptions.EnableRetryOnFailure() // tự retry khi lỗi tạm thời
    ));

// ===================== DEPENDENCY INJECTION =====================
// User
services.AddScoped<UserRepositories>();
services.AddScoped<UserService>();
services.AddScoped<JwtService>();
services.AddScoped<OTPService>();
services.AddMemoryCache();

// Field related
services.AddScoped<FieldTypesRepository>();
services.AddScoped<FieldTypeService>();

services.AddScoped<FieldComplexRepository>();
services.AddScoped<FieldComplexService>();

services.AddScoped<FieldRepository>();
services.AddScoped<FieldService>();

services.AddScoped<DepositPolicyRepository>();
services.AddScoped<DepositPolicyService>();

services.AddScoped<FieldScheduleRepository>();
services.AddScoped<IFieldScheduleRepository, FieldScheduleRepository>();
services.AddScoped<FieldScheduleService>();

services.AddScoped<FieldPriceRepository>();
services.AddScoped<FieldPriceService>();

services.AddScoped<TimeSlotRepository>();
services.AddScoped<TimeSlotService>();

// Booking
services.AddScoped<IBookingRepository, BookingRepository>();
services.AddScoped<BookingService>();
// Đăng ký PayOsService cùng HttpClient
services.AddHttpClient<PayOsService>();
services.AddHttpClient<PaymentService>();

services.AddScoped<IOwnerBankAccountRepository, OwnerBankAccountRepository>();


// Payment
services.AddScoped<IPaymentRepository, PaymentRepository>();
services.AddScoped<PaymentService>();
// ===================== SMTP (Email) =====================
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

// ===================== GOOGLE AUTH (nếu có) =====================
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
//===================== PayOS HTTP CLIENT CONFIG =====================
services.AddHttpClient<PayOsService>(client =>
{
    var payosConfig = builder.Configuration.GetSection("PayOS");
    client.BaseAddress = new Uri(payosConfig["BaseUrl"]);  
    client.DefaultRequestHeaders.Add("X-API-KEY", payosConfig["ApiKey"]);
});
services.AddScoped<PayOsService>();



>>>>>>> Stashed changes

var app = builder.Build();

// Cho Render tự lấy port đúng
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Add($"http://*:{port}");

// Luôn bật Swagger
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Route test
app.MapGet("/", () => "✅ API is running on Render!");

app.Run();
