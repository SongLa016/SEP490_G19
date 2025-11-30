using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class BookingPackageSessionDraft
{
    public int DraftId { get; set; }

    public int BookingPackageId { get; set; }

    public int UserId { get; set; }

    public int FieldId { get; set; }

    public int SlotId { get; set; }

    public byte DayOfWeek { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? ScheduleId { get; set; }
}
