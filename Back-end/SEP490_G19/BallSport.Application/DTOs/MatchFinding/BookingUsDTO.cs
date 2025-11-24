using System;

namespace BallSport.Application.DTOs.MatchFinding
{
    public class BookingUsDTO
    {
        public int BookingId { get; set; }
        public int UserId { get; set; }

        public int ScheduleId { get; set; }

        public decimal TotalPrice { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal? RemainingAmount { get; set; }

        public string? BookingStatus { get; set; }
        public string? PaymentStatus { get; set; }

        // ✔ Booking.HasOpponent = bool?
        public bool? HasOpponent { get; set; }

        // ✔ DB CreatedAt = DateTime?
        public DateTime? CreatedAt { get; set; }

        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancelledBy { get; set; }
        public string? CancelReason { get; set; }

        // extra relational fields
        public string? FieldName { get; set; }
        public string? ComplexName { get; set; }
        public string? SlotName { get; set; }

        // Slot start / end time is always valid => non-nullable ok
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}
