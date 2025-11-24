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

    public virtual ICollection<Field> Fields { get; set; } = new List<Field>();

    public virtual User? Owner { get; set; }
}
