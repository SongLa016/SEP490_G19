using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class FieldPrice
{
    public int PriceId { get; set; }

    public int? FieldId { get; set; }

    public int? SlotId { get; set; }

    public decimal Price { get; set; }

    public virtual Field? Field { get; set; }

    public virtual TimeSlot? Slot { get; set; }
}
