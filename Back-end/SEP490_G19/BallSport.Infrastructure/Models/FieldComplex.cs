using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class FieldComplex
{
    public int ComplexId { get; set; }

    public int? OwnerId { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public string? Description { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? ImageUrl { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public string? Ward { get; set; }

    public string? District { get; set; }

    public string? Province { get; set; }

    public DateTime? LastAutoPostAt { get; set; }
    public virtual User? Owner { get; set; }
    public virtual ICollection<Field> Fields { get; set; } = new List<Field>();
    public virtual ICollection<FavoriteField> FavoriteFields { get; set; } = new List<FavoriteField>();

    public virtual ICollection<FavoriteField> FavoriteFields { get; set; } = new List<FavoriteField>();

    public virtual ICollection<Field> Fields { get; set; } = new List<Field>();

    public virtual User? Owner { get; set; }

}
