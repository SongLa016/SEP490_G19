using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class FavoriteField
{
    public int FavoriteId { get; set; }

    public int UserId { get; set; }

    public int FieldId { get; set; }

    public int ComplexId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual FieldComplex Complex { get; set; } = null!;

    public virtual Field Field { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
