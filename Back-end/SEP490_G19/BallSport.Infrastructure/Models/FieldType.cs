using System;
using System.Collections.Generic;

namespace BallSport.Infrastructure.Models;

public partial class FieldType
{
    public int TypeId { get; set; }

    public string TypeName { get; set; } = null!;

    public virtual ICollection<Field> Fields { get; set; } = new List<Field>();
}
