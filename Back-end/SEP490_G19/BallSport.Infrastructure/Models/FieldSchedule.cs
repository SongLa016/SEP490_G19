using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class FieldSchedule
{
    public int ScheduleId { get; set; }

    public int? FieldId { get; set; }

    public int? SlotId { get; set; }

    public DateOnly Date { get; set; }

    public string? Status { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual Field? Field { get; set; }

    public virtual TimeSlot? Slot { get; set; }
}
