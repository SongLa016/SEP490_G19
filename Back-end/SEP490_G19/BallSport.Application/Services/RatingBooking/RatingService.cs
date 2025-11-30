using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Application.DTOs.RatingBooking;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.RatingBooking;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Application.Services.RatingBooking
{
    public class RatingService
    {
        private readonly Sep490G19v1Context _db;
        private readonly RatingRepository _ratingRepo;

        public RatingService(Sep490G19v1Context db, RatingRepository ratingRepo)
        {
            _db = db;
            _ratingRepo = ratingRepo;
        }

        public async Task<string> AddRatingAsync(int userId, RatingRequest request)
        {
            var booking = await _db.Bookings
                .Include(b => b.Schedule).ThenInclude(s => s.Field)
                .FirstOrDefaultAsync(b => b.BookingId == request.BookingId);

            if (booking == null)
                return "Booking not found";

            if (booking.UserId != userId)
                return "You can only rate your own bookings";

            if (booking.BookingStatus != "Completed")
                return "You can rate only after the match is completed";

            if (booking.PaymentStatus != "Paid")
                return "You must complete payment before rating";

            if (await _ratingRepo.HasRatedAsync(request.BookingId))
                return "You have already rated this booking";

            var rating = new Rating
            {
                BookingId = booking.BookingId,
                UserId = userId,
                FieldId = booking.Schedule.FieldId.Value,
                Stars = request.Stars,
                Comment = request.Comment,
                CreatedAt = DateTime.Now
            };

            await _ratingRepo.AddRatingAsync(rating);

            return "Rating submitted successfully";
        }

        //Hiển thị đánh giá theo fieldID
        public async Task<List<RatingDto>> GetRatingsOfFieldAsync(int fieldId)
        {
            var ratings = await _ratingRepo.GetRatingsByFieldIdAsync(fieldId);

            return ratings.Select(r => new RatingDto
            {
                UserName = r.User.FullName,
                Stars = r.Stars,
                Comment = r.Comment ?? "",
                CreatedAt = r.CreatedAt
            }).ToList();
        }
    }

}
