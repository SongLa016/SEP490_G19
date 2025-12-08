using BallSport.Application.DTOs.AISeoContent;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

public class AiDataService
{
    private readonly Sep490G19v1Context _context;

    public AiDataService(Sep490G19v1Context context)
    {
        _context = context;
    }

    public async Task<AiComplexDataDto?> GetComplexDataAsync(int complexId)
    {
        var complex = await _context.FieldComplexes
            .FirstOrDefaultAsync(x => x.ComplexId == complexId && x.Status == "Active");

        if (complex == null) return null;

        var fields = await _context.Fields
            .Where(f => f.ComplexId == complexId && f.Status == "Active")
            .Select(f => new FieldDto
            {
                FieldId = f.FieldId,
                Name = f.Name,
                Size = f.Size,
                GrassType = f.GrassType,
                PricePerHour = f.PricePerHour
            })
            .ToListAsync();

        var ratings = await _context.Ratings
            .Where(r => r.FieldId != null &&
                        _context.Fields.Any(f => f.FieldId == r.FieldId && f.ComplexId == complexId))
            .ToListAsync();

        var avgStars = ratings.Count == 0 ? 0 : Math.Round(ratings.Average(r => r.Stars), 1);

        var topComments = ratings
            .Where(r => !string.IsNullOrEmpty(r.Comment))
            .OrderByDescending(r => r.Stars)
            .Take(3)
            .Select(r => r.Comment!)
            .ToList();

        var totalBookings = await _context.Bookings.CountAsync();

        return new AiComplexDataDto
        {
            ComplexId = complex.ComplexId,
            Name = complex.Name,
            Address = complex.Address,
            Ward = complex.Ward,
            District = complex.District,
            Province = complex.Province,
            Description = complex.Description,

            AvgStars = avgStars,
            TotalBookings = totalBookings,

            Fields = fields,
            TopComments = topComments
        };
    }
}
