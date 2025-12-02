using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class TimeSlot
{
    public int SlotId { get; set; }

    public string? SlotName { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public int FieldId { get; set; }

    public decimal Price { get; set; }

    public virtual Field Field { get; set; } = null!;

    public virtual ICollection<FieldPrice> FieldPrices { get; set; } = new List<FieldPrice>();

    public virtual ICollection<FieldSchedule> FieldSchedules { get; set; } = new List<FieldSchedule>();
}
