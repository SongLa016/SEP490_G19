using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using BallSport.Application.Services;
using BallSport.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<Sep490G19v1Context>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn")));

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

builder.Services.AddScoped<FieldScheduleRepository>();
builder.Services.AddScoped<FieldScheduleService>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
